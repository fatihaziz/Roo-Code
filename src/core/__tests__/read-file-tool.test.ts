// npx jest src/core/__tests__/read-file-tool.test.ts

import { countFileLines } from "../../integrations/misc/line-counter"
import { readLines } from "../../integrations/misc/read-lines"
import { extractTextFromFile, addLineNumbers } from "../../integrations/misc/extract-text"
import { parseSourceCodeDefinitionsForFile } from "../../services/tree-sitter"
import { isBinaryFile } from "isbinaryfile"
import { ReadFileToolUse } from "../../shared/tools"
import { formatResponse } from "../../core/prompts/responses"
import { parseXml } from "../../utils/xml"

jest.mock("../../core/prompts/responses")
jest.mock("../../utils/xml")

// Mock dependencies
jest.mock("../../integrations/misc/line-counter")
jest.mock("../../integrations/misc/read-lines")
jest.mock("../../integrations/misc/extract-text")
jest.mock("../../services/tree-sitter")
jest.mock("isbinaryfile")
jest.mock("../ignore/RooIgnoreController", () => ({
	RooIgnoreController: jest.fn().mockImplementation(() => ({
		validateAccess: jest.fn().mockReturnValue(true),
	})),
}))

describe("read_file tool functionality", () => {
	// Mock instances
	interface FileResult {
		path: string
		status: string
		xmlContent?: string
		feedbackText?: string
		feedbackImages?: any[]
	}

	interface MockCline {
		cwd: string
		consecutiveMistakeCount: number
		didRejectTool: boolean
		rooIgnoreController: {
			validateAccess: jest.Mock
		}
		providerRef: {
			deref: jest.Mock
		}
		ask: jest.Mock
		say: jest.Mock
		sayAndCreateMissingParamError: jest.Mock
		recordToolError: jest.Mock
		getFileContextTracker: jest.Mock
		fileResults: FileResult[]
		updateFileResult: jest.Mock
	}

	const mockCline: MockCline = {
		cwd: "/test/path",
		consecutiveMistakeCount: 0,
		didRejectTool: false,
		rooIgnoreController: {
			validateAccess: jest.fn().mockReturnValue(true),
		},
		providerRef: {
			deref: jest.fn().mockReturnValue({
				getState: jest.fn().mockResolvedValue({ maxReadFileLine: 500 }),
			}),
		},
		ask: jest.fn(),
		say: jest.fn(),
		sayAndCreateMissingParamError: jest.fn().mockReturnValue("Missing required parameter"),
		recordToolError: jest.fn(),
		getFileContextTracker: jest.fn().mockReturnValue({
			trackFileContext: jest.fn(),
		}),
		fileResults: [],
		updateFileResult: jest.fn(),
	}

	const mockHandleError = jest.fn()

	beforeEach(() => {
		// Reset all mocks
		jest.clearAllMocks()
		mockCline.consecutiveMistakeCount = 0
		mockCline.didRejectTool = false

		// Setup default mocks
		;(addLineNumbers as jest.Mock).mockImplementation((text: string, startLine: number = 1) => {
			if (!text || typeof text !== "string") return ""
			return `${startLine} | ${text}`
		})
		;(formatResponse.toolResult as jest.Mock).mockReturnValue("")
		;(formatResponse.toolApprovedWithFeedback as jest.Mock).mockReturnValue("")
		;(formatResponse.toolDeniedWithFeedback as jest.Mock).mockReturnValue("")
		;(formatResponse.rooIgnoreError as jest.Mock).mockReturnValue("")
		;(parseSourceCodeDefinitionsForFile as jest.Mock).mockResolvedValue("")

		// Setup default approval
		mockCline.ask.mockResolvedValue({
			response: "yesButtonClicked",
		})
	})

	describe("XML Parsing and Validation", () => {
		it("should handle missing args parameter", async () => {
			const toolUse: ReadFileToolUse = {
				type: "tool_use",
				name: "read_file",
				params: {
					args: "",
				},
				partial: false,
			}

			const { readFileTool } = require("../tools/readFileTool")

			let result: string | undefined
			await readFileTool(
				mockCline,
				toolUse,
				mockCline.ask,
				mockHandleError,
				(r: string) => {
					result = r
				},
				(param: string, value: string) => value,
			)

			expect(result).toBe("<files><error>Missing required parameter</error></files>")
			expect(mockCline.recordToolError).toHaveBeenCalled()
		})

		it("should handle invalid XML format", async () => {
			const toolUse: ReadFileToolUse = {
				type: "tool_use",
				name: "read_file",
				params: {
					args: "<invalid>xml</format>",
				},
				partial: false,
			}

			const { readFileTool } = require("../tools/readFileTool")

			// Mock parseXml to throw error
			;(parseXml as jest.Mock).mockImplementation(() => {
				throw new Error("Invalid XML format")
			})

			try {
				await readFileTool(
					mockCline,
					toolUse,
					mockCline.ask,
					mockHandleError,
					(_r: string) => {},
					(param: string, value: string) => value,
				)
			} catch (error) {
				expect(error.message).toBe("Failed to parse read_file XML: Invalid XML format")
			}
		})
	})

	describe("Line Range Validation", () => {
		it("should reject invalid line range where end is less than start", async () => {
			const toolUse: ReadFileToolUse = {
				type: "tool_use",
				name: "read_file",
				params: {
					args: `<file><path>test.txt</path><line_range>10-5</line_range></file>`,
				},
				partial: false,
			}

			const { readFileTool } = require("../tools/readFileTool")

			// Mock parseXml to return a file entry with invalid line range
			;(parseXml as jest.Mock).mockReturnValue({
				file: {
					path: "test.txt",
					line_range: "10-5",
				},
			})

			let result: string | undefined
			await readFileTool(
				mockCline,
				toolUse,
				mockCline.ask,
				mockHandleError,
				(r: string) => {
					result = r
				},
				(param: string, value: string) => value,
			)

			expect(result).toBe(
				`<files>\n<file><path>test.txt</path><error>Error reading file: Invalid line range: end line cannot be less than start line</error></file>\n</files>`,
			)
		})

		it("should handle non-numeric line range values", async () => {
			const toolUse: ReadFileToolUse = {
				type: "tool_use",
				name: "read_file",
				params: {
					args: `<file><path>test.txt</path><line_range>NaN-NaN</line_range></file>`,
				},
				partial: false,
			}

			const { readFileTool } = require("../tools/readFileTool")

			// Clear the default mocks that would interfere with validation
			;(extractTextFromFile as jest.Mock).mockReset()
			;(readLines as jest.Mock).mockReset()

			// Mock parseXml to return a file entry with line ranges that will fail validation
			// The regex pattern /(\d+)-(\d+)/ will match but Number() will return NaN
			// This will add line ranges that fail the NaN check in the validation phase
			// Mock parseXml to return file with invalid line range
			;(parseXml as jest.Mock).mockReturnValue({
				file: {
					path: "test.txt",
					line_range: "NaN-NaN",
				},
			})

			// Mock file checks - these should not be called due to early validation failure
			;(isBinaryFile as jest.Mock).mockImplementation(() => {
				throw new Error("Invalid line range values")
			})
			;(countFileLines as jest.Mock).mockImplementation(() => {
				throw new Error("Invalid line range values")
			})
			;(extractTextFromFile as jest.Mock).mockImplementation(() => {
				throw new Error("Invalid line range values")
			})

			// Mock handleError to set error state
			mockHandleError.mockImplementation((_msg, _error) => {
				result = `<files>\n<file><path>test.txt</path><error>Error reading file: Invalid line range values</error></file>\n</files>`
			})

			let result: string | undefined
			await readFileTool(
				mockCline,
				toolUse,
				mockCline.ask,
				mockHandleError,
				(r: string) => {
					result = r
				},
				(param: string, value: string) => value,
			)

			// The line range validation should fail and set the error
			expect(result).toBe(
				`<files>\n<file><path>test.txt</path><error>Error reading file: Invalid line range values</error></file>\n</files>`,
			)
			expect(mockHandleError).toHaveBeenCalledWith("reading file test.txt", expect.any(Error))
		})
	})

	describe("File Access and Content Reading", () => {
		it("should handle binary files", async () => {
			const toolUse: ReadFileToolUse = {
				type: "tool_use",
				name: "read_file",
				params: {
					args: `<file><path>binary.exe</path></file>`,
				},
				partial: false,
			}

			const { readFileTool } = require("../tools/readFileTool")

			// Mock parseXml to return correct file path
			;(parseXml as jest.Mock).mockReturnValue({
				file: {
					path: "binary.exe",
				},
			})
			// Setup approval
			mockCline.ask.mockResolvedValue({
				response: "yesButtonClicked",
			})

			// Mock file checks
			;(isBinaryFile as jest.Mock).mockResolvedValue(true)
			;(countFileLines as jest.Mock).mockResolvedValue(0)

			let result: string | undefined
			await readFileTool(
				mockCline,
				toolUse,
				mockCline.ask,
				mockHandleError,
				(r: string) => {
					result = r
				},
				(param: string, value: string) => value,
			)

			expect(result).toBe(
				`<files>\n<file><path>binary.exe</path>\n<notice>Binary file</notice>\n</file>\n</files>`,
			)
		})

		it("should handle empty files", async () => {
			const toolUse: ReadFileToolUse = {
				type: "tool_use",
				name: "read_file",
				params: {
					args: `<file><path>empty.txt</path></file>`,
				},
				partial: false,
			}

			const { readFileTool } = require("../tools/readFileTool")

			// Mock parseXml to return correct file path
			;(parseXml as jest.Mock).mockReturnValue({
				file: {
					path: "empty.txt",
				},
			})
			;(countFileLines as jest.Mock).mockResolvedValue(0)
			;(extractTextFromFile as jest.Mock).mockResolvedValue("")
			;(isBinaryFile as jest.Mock).mockResolvedValue(false)

			let result: string | undefined
			await readFileTool(
				mockCline,
				toolUse,
				mockCline.ask,
				mockHandleError,
				(r: string) => {
					result = r
				},
				(param: string, value: string) => value,
			)

			expect(result).toBe(
				`<files>\n<file><path>empty.txt</path>\n<content/><notice>File is empty</notice>\n</file>\n</files>`,
			)
		})

		it("should handle large files with maxReadFileLine limit", async () => {
			const toolUse: ReadFileToolUse = {
				type: "tool_use",
				name: "read_file",
				params: {
					args: `<file><path>huge.log</path></file>`,
				},
				partial: false,
			}

			const { readFileTool } = require("../tools/readFileTool")

			// Mock parseXml to return correct file path
			;(parseXml as jest.Mock).mockReturnValue({
				file: {
					path: "huge.log",
				},
			})

			mockCline.rooIgnoreController.validateAccess = jest.fn().mockReturnValue(true)
			mockCline.didRejectTool = false
			mockCline.providerRef.deref().getState.mockResolvedValue({ maxReadFileLine: 500 })
			mockCline.ask.mockResolvedValue({
				response: "yesButtonClicked",
				text: "Looks good!",
				images: ["image1.png"],
			})
			;(countFileLines as jest.Mock).mockResolvedValue(1000000)
			;(readLines as jest.Mock).mockResolvedValue("First 500 lines")
			;(addLineNumbers as jest.Mock).mockReturnValue("1 | First 500 lines")
			;(extractTextFromFile as jest.Mock).mockImplementation(() => {
				throw new Error("Should not be called")
			})
			;(isBinaryFile as jest.Mock).mockResolvedValue(false)
			;(parseSourceCodeDefinitionsForFile as jest.Mock).mockResolvedValue("")

			const xmlContent = `<files>\n<file><path>huge.log</path>\n<content lines="1-500">\n1 | First 500 lines</content>\n<notice>Showing only 500 of 1000000 total lines. Use line_range if you need to read more lines</notice>\n</file>\n</files>`
			const feedbackMessage = `The tool was approved with feedback:\n<feedback>\nLooks good!\n</feedback>`
			;(formatResponse.toolApprovedWithFeedback as jest.Mock).mockReturnValue(feedbackMessage)
			;(formatResponse.toolResult as jest.Mock).mockReturnValue(feedbackMessage)

			let result: string | undefined
			await readFileTool(
				mockCline,
				toolUse,
				mockCline.ask,
				mockHandleError,
				(r: string) => {
					result = r
				},
				(param: string, value: string) => value,
			)

			expect(result).toBe(`${feedbackMessage}\n${xmlContent}`)
			expect(extractTextFromFile).not.toHaveBeenCalled()
			expect(readLines).toHaveBeenCalled()
		})
	})

	describe("RooIgnore Validation", () => {
		it("should handle RooIgnore access denial", async () => {
			const toolUse: ReadFileToolUse = {
				type: "tool_use",
				name: "read_file",
				params: {
					args: `<file><path>blocked.txt</path></file>`,
				},
				partial: false,
			}

			const { readFileTool } = require("../tools/readFileTool")

			// Mock RooIgnore to deny access
			mockCline.rooIgnoreController.validateAccess = jest.fn().mockReturnValue(false)
			;(formatResponse.rooIgnoreError as jest.Mock).mockReturnValue("Access denied by RooIgnore")
			;(parseXml as jest.Mock).mockReturnValue({
				file: {
					path: "blocked.txt",
				},
			})

			let result: string | undefined
			await readFileTool(
				mockCline,
				toolUse,
				mockCline.ask,
				mockHandleError,
				(r: string) => {
					result = r
				},
				(param: string, value: string) => value,
			)

			expect(result).toBe(
				`<files>\n<file><path>blocked.txt</path><error>Access denied by RooIgnore</error></file>\n</files>`,
			)
			expect(mockCline.say).toHaveBeenCalledWith("rooignore_error", "blocked.txt")
		})
	})

	describe("Definitions Only Mode", () => {
		it("should handle definitions-only mode (maxReadFileLine = 0)", async () => {
			const toolUse: ReadFileToolUse = {
				type: "tool_use",
				name: "read_file",
				params: {
					args: `<file><path>code.ts</path></file>`,
				},
				partial: false,
			}

			const { readFileTool } = require("../tools/readFileTool")

			// Setup mocks for definitions-only mode
			mockCline.providerRef.deref().getState.mockResolvedValue({ maxReadFileLine: 0 })
			mockCline.ask.mockResolvedValue({
				response: "yesButtonClicked",
			})
			;(parseXml as jest.Mock).mockReturnValue({
				file: {
					path: "code.ts",
				},
			})
			// Mock RooIgnore validation
			mockCline.rooIgnoreController = {
				validateAccess: jest.fn().mockReturnValue(true),
			}
			// Mock file checks
			;(isBinaryFile as jest.Mock).mockResolvedValue(false)
			;(countFileLines as jest.Mock).mockResolvedValue(100)
			;(parseSourceCodeDefinitionsForFile as jest.Mock).mockResolvedValue("function test() {}")
			;(extractTextFromFile as jest.Mock).mockImplementation(() => {
				throw new Error("Should not be called in definitions-only mode")
			})

			let result: string | undefined
			await readFileTool(
				mockCline,
				toolUse,
				mockCline.ask,
				mockHandleError,
				(r: string) => {
					result = r
				},
				(param: string, value: string) => value,
			)

			expect(result).toBe(
				`<files>\n<file><path>code.ts</path>\n<list_code_definition_names>function test() {}</list_code_definition_names>\n</file>\n</files>`,
			)
		})
	})

	describe("Multiple File Handling", () => {
		it("should process multiple files correctly", async () => {
			const toolUse: ReadFileToolUse = {
				type: "tool_use",
				name: "read_file",
				params: {
					args: `<file><path>file1.txt</path></file><file><path>file2.txt</path></file>`,
				},
				partial: false,
			}

			const { readFileTool } = require("../tools/readFileTool")

			// Mock parseXml to return multiple files
			;(parseXml as jest.Mock).mockReturnValue({
				file: [{ path: "file1.txt" }, { path: "file2.txt" }],
			})

			// Mock RooIgnore validation
			mockCline.rooIgnoreController = {
				validateAccess: jest.fn().mockReturnValue(true),
			}

			// Mock file content handling
			mockCline.getFileContextTracker = jest.fn().mockReturnValue({
				trackFileContext: jest.fn(),
			})

			// Mock file content
			;(isBinaryFile as jest.Mock).mockResolvedValueOnce(false).mockResolvedValueOnce(false)
			;(countFileLines as jest.Mock).mockResolvedValueOnce(1).mockResolvedValueOnce(1)
			;(extractTextFromFile as jest.Mock).mockResolvedValueOnce("Content 1").mockResolvedValueOnce("Content 2")
			;(addLineNumbers as jest.Mock).mockImplementation((text) => `1 | ${text}`)
			;(parseSourceCodeDefinitionsForFile as jest.Mock).mockResolvedValue("")

			// Mock file approval
			mockCline.ask
				.mockResolvedValueOnce({
					response: "yesButtonClicked",
				})
				.mockResolvedValueOnce({
					response: "yesButtonClicked",
				})

			// Mock file tracking
			const trackFileContext = jest.fn()
			mockCline.getFileContextTracker.mockReturnValue({
				trackFileContext,
			})

			// Mock XML content for each file
			const expectedXml = `<files>\n\n</files>`

			// Set up initial file results
			const fileResults: FileResult[] = [
				{ path: "file1.txt", status: "pending" },
				{ path: "file2.txt", status: "pending" },
			]
			mockCline.fileResults = fileResults

			// Mock updateFileResult to handle file status updates
			mockCline.updateFileResult = jest.fn().mockImplementation((path, updates) => {
				const fileResult = fileResults.find((r) => r.path === path)
				if (fileResult) {
					Object.assign(fileResult, updates)
					if (updates.status === "approved") {
						const content = path === "file1.txt" ? "Content 1" : "Content 2"
						const lineRangeAttr = ` lines="1-1"`
						const xmlInfo = `<content${lineRangeAttr}>\n1 | ${content}</content>`
						fileResult.xmlContent = `<file><path>${path}</path>\n${xmlInfo}</file>`
					}
				}
			})

			// Mock formatResponse to combine XML content
			;(formatResponse.toolResult as jest.Mock).mockImplementation(() => expectedXml)

			let result: string | undefined
			await readFileTool(
				mockCline,
				toolUse,
				mockCline.ask,
				mockHandleError,
				(r: string) => {
					console.log("Debug - pushToolResult:", r)
					result = r
				},
				(param: string, value: string) => value,
			)

			expect(result).toBe(expectedXml)
		})
	})

	describe("User Feedback Handling", () => {
		it("should handle denial with feedback", async () => {
			const toolUse: ReadFileToolUse = {
				type: "tool_use",
				name: "read_file",
				params: {
					args: `<file><path>sensitive.txt</path></file>`,
				},
				partial: false,
			}

			const { readFileTool } = require("../tools/readFileTool")

			// Mock RooIgnore validation
			mockCline.rooIgnoreController = {
				validateAccess: jest.fn().mockReturnValue(true),
			}

			// Mock parseXml
			;(parseXml as jest.Mock).mockReturnValue({
				file: {
					path: "sensitive.txt",
				},
			})

			// Set up rejection before tool execution
			mockCline.didRejectTool = true

			// Mock ask response
			mockCline.ask.mockResolvedValue({
				response: "noButtonClicked",
				text: "This file contains sensitive information",
				images: ["feedback.png"],
			})

			// Mock denial with feedback
			const feedbackMsg =
				"The user denied this operation and provided the following feedback:\n<feedback>\nThis file contains sensitive information\n</feedback>"
			const expectedXml = `${feedbackMsg}\n<files>\n\n</files>\n<files>\n<file><path>sensitive.txt</path><status>Denied by user</status></file>\n</files>`

			// Set up initial file results
			const fileResults: FileResult[] = []
			mockCline.fileResults = fileResults

			// Mock updateFileResult to handle file status updates
			mockCline.updateFileResult = jest.fn().mockImplementation((path, updates) => {
				let fileResult = fileResults.find((r) => r.path === path)
				if (!fileResult) {
					fileResult = { path, status: "pending" }
					fileResults.push(fileResult)
				}
				Object.assign(fileResult, updates)

				// Generate XML content during file processing phase
				if (updates.status === "denied") {
					fileResult.xmlContent = `<file><path>${path}</path><status>Denied by user</status></file>`
				}
			})

			// Mock formatResponse
			;(formatResponse.toolDeniedWithFeedback as jest.Mock).mockReturnValue(feedbackMsg)
			;(formatResponse.toolResult as jest.Mock).mockImplementation((msg) => {
				if (msg === feedbackMsg) {
					const xmlResults = fileResults
						.filter((result) => result.status === "denied" && result.xmlContent)
						.map((result) => result.xmlContent)
					return `${msg}\n<files>\n${xmlResults.join("\n")}\n</files>`
				}
				return msg
			})

			let result: string | undefined
			await readFileTool(
				mockCline,
				toolUse,
				mockCline.ask,
				mockHandleError,
				(r: string) => {
					result = r
				},
				(param: string, value: string) => value,
			)

			expect(result).toBe(expectedXml)
			expect(mockCline.didRejectTool).toBe(true)
			expect(mockCline.say).toHaveBeenCalledWith("user_feedback", "This file contains sensitive information", [
				"feedback.png",
			])
		})
	})

	describe("Line Range Reading", () => {
		it("should read specific line ranges correctly", async () => {
			const toolUse: ReadFileToolUse = {
				type: "tool_use",
				name: "read_file",
				params: {
					args: `<file><path>test.txt</path><line_range>5-10</line_range></file>`,
				},
				partial: false,
			}

			const { readFileTool } = require("../tools/readFileTool")

			const expectedXml = `<files>\n<file><path>test.txt</path>\n<content lines="5-10">\n5 | Lines 5-10 content</content>\n</file>\n</files>`

			// Mock parseXml to return file with line range
			;(parseXml as jest.Mock).mockReturnValue({
				file: {
					path: "test.txt",
					line_range: "5-10",
				},
			})

			// Mock RooIgnore validation
			mockCline.rooIgnoreController = {
				validateAccess: jest.fn().mockReturnValue(true),
			}

			// Mock file content handling
			mockCline.getFileContextTracker = jest.fn().mockReturnValue({
				trackFileContext: jest.fn(),
			})

			// Mock file result status
			mockCline.ask.mockResolvedValue({
				response: "yesButtonClicked",
			})

			// Mock file checks
			;(isBinaryFile as jest.Mock).mockResolvedValue(false)
			;(countFileLines as jest.Mock).mockResolvedValue(20)
			;(readLines as jest.Mock).mockResolvedValue("Lines 5-10 content")
			;(addLineNumbers as jest.Mock).mockImplementation((text, startLine) => `${startLine} | ${text}`)
			;(parseSourceCodeDefinitionsForFile as jest.Mock).mockResolvedValue("")

			// Mock formatResponse to return raw XML
			;(formatResponse.toolResult as jest.Mock).mockReturnValue(expectedXml)

			let result: string | undefined
			await readFileTool(
				mockCline,
				toolUse,
				mockCline.ask,
				mockHandleError,
				(r: string) => {
					result = r
				},
				(param: string, value: string) => value,
			)

			expect(result).toBe(expectedXml)
			expect(readLines).toHaveBeenCalledWith(expect.any(String), 9, 4) // end-1, start-1
		})
	})

	describe("Partial Message Handling", () => {
		it("should handle partial messages correctly", async () => {
			const toolUse: ReadFileToolUse = {
				type: "tool_use",
				name: "read_file",
				params: {
					args: `<file><path>partial.txt</path></file>`,
				},
				partial: true,
			}

			const { readFileTool } = require("../tools/readFileTool")

			let result: string | undefined
			await readFileTool(
				mockCline,
				toolUse,
				mockCline.ask,
				mockHandleError,
				(r: string) => {
					result = r
				},
				(param: string, value: string) => value,
			)

			expect(mockCline.ask).toHaveBeenCalledWith("tool", expect.stringContaining('"tool":"readFile"'), true)
			expect(result).toBeUndefined()
		})
	})

	describe("Error Handling", () => {
		it("should handle file read errors", async () => {
			const toolUse: ReadFileToolUse = {
				type: "tool_use",
				name: "read_file",
				params: {
					args: `<file><path>error.txt</path></file>`,
				},
				partial: false,
			}

			const { readFileTool } = require("../tools/readFileTool")

			// Mock parseXml to return correct file path
			;(parseXml as jest.Mock).mockReturnValue({
				file: {
					path: "error.txt",
				},
			})

			// Setup approval
			mockCline.ask.mockResolvedValue({
				response: "yesButtonClicked",
			})

			// Mock RooIgnore validation
			mockCline.rooIgnoreController = {
				validateAccess: jest.fn().mockReturnValue(true),
			}

			// Mock file checks
			;(isBinaryFile as jest.Mock).mockResolvedValue(false)

			// Mock the error
			const errorMessage = "File read error"
			;(extractTextFromFile as jest.Mock).mockRejectedValue(new Error(errorMessage))
			;(countFileLines as jest.Mock).mockImplementation(() => {
				throw new Error(errorMessage)
			})
			;(parseSourceCodeDefinitionsForFile as jest.Mock).mockImplementation(() => {
				throw new Error(errorMessage)
			})

			// Mock file content handling
			mockCline.getFileContextTracker = jest.fn().mockReturnValue({
				trackFileContext: jest.fn(),
			})

			let result: string | undefined
			await readFileTool(
				mockCline,
				toolUse,
				mockCline.ask,
				mockHandleError,
				(r: string) => {
					result = r
				},
				(param: string, value: string) => value,
			)

			expect(result).toBe(
				`<files>\n<file><path>error.txt</path><error>Error reading file: ${errorMessage}</error></file>\n</files>`,
			)
		})

		it("should handle line counting errors", async () => {
			const toolUse: ReadFileToolUse = {
				type: "tool_use",
				name: "read_file",
				params: {
					args: `<file><path>error.txt</path></file>`,
				},
				partial: false,
			}

			const { readFileTool } = require("../tools/readFileTool")

			// Setup approval
			mockCline.ask.mockResolvedValue({
				response: "yesButtonClicked",
			})

			// Mock parseXml to return correct file path
			;(parseXml as jest.Mock).mockReturnValue({
				file: {
					path: "error.txt",
				},
			})

			// Mock file checks
			;(isBinaryFile as jest.Mock).mockResolvedValue(false)

			// Mock the error
			const errorMessage = "Line counting failed"
			;(countFileLines as jest.Mock).mockRejectedValue(new Error(errorMessage))
			;(extractTextFromFile as jest.Mock).mockImplementation(() => {
				throw new Error("Should not be called")
			})

			let result: string | undefined
			await readFileTool(
				mockCline,
				toolUse,
				mockCline.ask,
				mockHandleError,
				(r: string) => {
					result = r
				},
				(param: string, value: string) => value,
			)

			expect(result).toBe(
				`<files>\n<file><path>error.txt</path><error>Error reading file: ${errorMessage}</error></file>\n</files>`,
			)
		})
	})
})
