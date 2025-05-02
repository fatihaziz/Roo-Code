// npx jest src/core/__tests__/read-file-tool.test.ts

import * as path from "path"
import { countFileLines } from "../../integrations/misc/line-counter"
import { readLines } from "../../integrations/misc/read-lines"
import { extractTextFromFile, addLineNumbers } from "../../integrations/misc/extract-text"
import { parseSourceCodeDefinitionsForFile } from "../../services/tree-sitter"
import { isBinaryFile } from "isbinaryfile"
import { ReadFileToolUse } from "../../shared/tools"

// Mock dependencies
jest.mock("../../integrations/misc/line-counter")
jest.mock("../../integrations/misc/read-lines")
jest.mock("../../integrations/misc/extract-text")
jest.mock("../../services/tree-sitter")
jest.mock("isbinaryfile")
jest.mock("../ignore/RooIgnoreController", () => ({
	RooIgnoreController: class {
		initialize() {
			return Promise.resolve()
		}
		validateAccess() {
			return true
		}
	},
}))

// Mocked functions with correct types
const mockedCountFileLines = countFileLines as jest.MockedFunction<typeof countFileLines>
const mockedReadLines = readLines as jest.MockedFunction<typeof readLines>
const mockedExtractTextFromFile = extractTextFromFile as jest.MockedFunction<typeof extractTextFromFile>

describe("read_file tool functionality", () => {
	// Mock instances
	const mockCline = {
		cwd: "/test",
		task: "Test",
		providerRef: {
			getState: jest.fn().mockResolvedValue({ maxReadFileLine: 500 }),
			deref: jest.fn().mockReturnThis(),
		},
		rooIgnoreController: {
			validateAccess: jest.fn().mockReturnValue(true),
		},
		say: jest.fn().mockResolvedValue(undefined),
		ask: jest.fn().mockResolvedValue({ response: "yesButtonClicked" }),
		presentAssistantMessage: jest.fn(),
		getFileContextTracker: jest.fn().mockReturnValue({
			trackFileContext: jest.fn().mockResolvedValue(undefined),
		}),
		recordToolUsage: jest.fn(),
		recordToolError: jest.fn(),
		sayAndCreateMissingParamError: jest.fn().mockResolvedValue("Missing required parameter"),
		consecutiveMistakeCount: 0,
		didRejectTool: false,
	}

	beforeEach(() => {
		jest.clearAllMocks()
		mockCline.consecutiveMistakeCount = 0
		mockCline.didRejectTool = false

		// Setup default mocks
		;(extractTextFromFile as jest.Mock).mockImplementation(() => Promise.resolve("Test content"))
		;(readLines as jest.Mock).mockImplementation(() => Promise.resolve("Test content"))
		;(addLineNumbers as jest.Mock).mockImplementation((text: string) => {
			if (!text) return ""
			return text
				.split("\n")
				.map((line: string, i: number) => `${i + 1} | ${line}`)
				.join("\n")
		})
		;(isBinaryFile as jest.Mock).mockResolvedValue(false)
		;(parseSourceCodeDefinitionsForFile as jest.Mock).mockResolvedValue("")
		mockCline.ask.mockResolvedValue({
			response: "yesButtonClicked",
			text: "Looks good!",
			images: ["image1.png"],
		})

		// Reset mock implementations
		;(extractTextFromFile as jest.Mock).mockClear()
		;(readLines as jest.Mock).mockClear()
		;(addLineNumbers as jest.Mock).mockClear()
	})

	describe("Args Parameter Format", () => {
		it("should handle single file read with line range", async () => {
			const toolUse: ReadFileToolUse = {
				type: "tool_use",
				name: "read_file",
				params: {
					args: `<file><path>src/app.ts</path><line_range>1-100</line_range></file>`,
				},
				partial: false,
			}

			const { readFileTool } = require("../tools/readFileTool")

			;(countFileLines as jest.Mock).mockResolvedValue(200)
			;(readLines as jest.Mock).mockResolvedValue("Test content")
			;(addLineNumbers as jest.Mock).mockReturnValue("1 | Test content")

			let result: string | undefined
			await readFileTool(
				mockCline,
				toolUse,
				mockCline.ask,
				jest.fn(),
				(r: string) => {
					result = r
				},
				(param: string, value: string) => value,
			)

			expect(result).toBe(
				`<files>\n<file><path>src/app.ts</path>\n<content lines="1-100">\n1 | Test content</content>\n</file>\n</files>`,
			)
		})

		it("should handle multiple file reads", async () => {
			const toolUse: ReadFileToolUse = {
				type: "tool_use",
				name: "read_file",
				params: {
					args: `<file><path>src/app.ts</path><line_range>1-50</line_range></file><file><path>src/utils.ts</path></file>`,
				},
				partial: false,
			}

			const { readFileTool } = require("../tools/readFileTool")

			// Mock for first file with range
			;(readLines as jest.Mock).mockImplementationOnce(() => Promise.resolve("Test content"))
			;(addLineNumbers as jest.Mock).mockImplementationOnce(() => "1 | Test content")

			// Mock for second file
			;(countFileLines as jest.Mock).mockResolvedValue(100)
			;(extractTextFromFile as jest.Mock).mockResolvedValue("1 | Test content")

			let result: string | undefined
			await readFileTool(
				mockCline,
				toolUse,
				mockCline.ask,
				jest.fn(),
				(r: string) => {
					result = r
				},
				(param: string, value: string) => value,
			)

			expect(result).toBe(
				`<files>\n<file><path>src/app.ts</path>\n<content lines="1-50">\n1 | Test content</content>\n</file>\n<file><path>src/utils.ts</path>\n<content lines="1-100">\n1 | Test content</content>\n</file>\n</files>`,
			)
		})

		it("should handle invalid line range parameters", async () => {
			// Setup
			mockedReadLines.mockRejectedValue(new Error("Invalid line range: invalid values"))
			mockedExtractTextFromFile.mockRejectedValue(new Error("Invalid line range: invalid values"))

			const toolUse: ReadFileToolUse = {
				type: "tool_use",
				name: "read_file",
				params: {
					args: `<file><path>src/app.ts</path><line_range>abc-def</line_range></file>`,
				},
				partial: false,
			}

			const { readFileTool } = require("../tools/readFileTool")

			let result: string | undefined
			await readFileTool(
				mockCline,
				toolUse,
				mockCline.ask,
				jest.fn(),
				(r: string) => {
					result = r
				},
				(param: string, value: string) => value,
			)

			expect(result).toBe(
				`<files>\n<file><path>src/app.ts</path><error>Error reading file: Invalid line range: invalid values</error></file>\n</files>`,
			)
		})

		it("should handle empty file entries in multiple file reads", async () => {
			const toolUse: ReadFileToolUse = {
				type: "tool_use",
				name: "read_file",
				params: {
					args: `<file><path>src/app.ts</path></file><file><path>src/utils.ts</path></file>`,
				},
				partial: false,
			}

			const { readFileTool } = require("../tools/readFileTool")

			let result: string | undefined
			await readFileTool(
				mockCline,
				toolUse,
				mockCline.ask,
				jest.fn(),
				(r: string) => {
					result = r
				},
				(param: string, value: string) => value,
			)

			expect(result).toContain("<file><path>src/app.ts</path>")
			expect(result).toContain("<file><path>src/utils.ts</path>")
			expect(result).not.toContain("<error>")
		})
	})

	describe("File Content Reading", () => {
		it("should read entire file when line count is less than maxReadFileLine", async () => {
			const toolUse: ReadFileToolUse = {
				type: "tool_use",
				name: "read_file",
				params: {
					args: `<file><path>smallFile.txt</path></file>`,
				},
				partial: false,
			}

			const { readFileTool } = require("../tools/readFileTool")

			;(countFileLines as jest.Mock).mockResolvedValue(100)
			;(extractTextFromFile as jest.Mock).mockResolvedValue("1 | Test content")
			;(addLineNumbers as jest.Mock).mockReturnValue("1 | Small file content")

			let result: string | undefined
			await readFileTool(
				mockCline,
				toolUse,
				mockCline.ask,
				jest.fn(),
				(r: string) => {
					result = r
				},
				(param: string, value: string) => value,
			)

			expect(result).toBe(
				`<files>\n<file><path>smallFile.txt</path>\n<content lines="1-100">\n1 | Test content</content>\n</file>\n</files>`,
			)
		})

		it("should truncate file when line count exceeds maxReadFileLine", async () => {
			const toolUse: ReadFileToolUse = {
				type: "tool_use",
				name: "read_file",
				params: {
					args: `<file><path>largeFile.txt</path></file>`,
				},
				partial: false,
			}

			const { readFileTool } = require("../tools/readFileTool")

			;(countFileLines as jest.Mock).mockResolvedValue(5000)
			;(readLines as jest.Mock).mockResolvedValue("Test content")
			;(addLineNumbers as jest.Mock).mockReturnValue("1 | Test content")
			;(parseSourceCodeDefinitionsForFile as jest.Mock).mockResolvedValue("")
			mockCline.providerRef.getState.mockResolvedValue({ maxReadFileLine: 500 })

			// Reset mocks to ensure clean state
			;(extractTextFromFile as jest.Mock).mockReset()
			;(readLines as jest.Mock).mockReset().mockResolvedValue("Test content")

			let result: string | undefined
			await readFileTool(
				mockCline,
				toolUse,
				mockCline.ask,
				jest.fn(),
				(r: string) => {
					result = r
				},
				(param: string, value: string) => value,
			)

			expect(result).toBe(
				`<files>\n<file><path>largeFile.txt</path>\n<content lines="1-500">\n1 | Test content</content>\n<notice>Showing only 500 of 5000 total lines. Use line_range if you need to read more lines</notice>\n</file>\n</files>`,
			)
		})

		it("should handle binary files correctly", async () => {
			const toolUse: ReadFileToolUse = {
				type: "tool_use",
				name: "read_file",
				params: {
					args: `<file><path>binary.pdf</path></file>`,
				},
				partial: false,
			}

			const { readFileTool } = require("../tools/readFileTool")

			;(isBinaryFile as jest.Mock).mockResolvedValue(true)
			;(extractTextFromFile as jest.Mock).mockResolvedValue("PDF content")

			let result: string | undefined
			await readFileTool(
				mockCline,
				toolUse,
				mockCline.ask,
				jest.fn(),
				(r: string) => {
					result = r
				},
				(param: string, value: string) => value,
			)

			expect(result).toBe(
				`<files>\n<file><path>binary.pdf</path>\n<notice>Binary file</notice>\n</file>\n</files>`,
			)
		})

		it("should handle large binary files with line ranges", async () => {
			const filePath = "large.pdf"
			const fullPath = path.resolve(mockCline.cwd, filePath)

			const toolUse: ReadFileToolUse = {
				type: "tool_use",
				name: "read_file",
				params: {
					args: `<file><path>${filePath}</path><line_range>1-100</line_range></file>`,
				},
				partial: false,
			}

			const { readFileTool } = require("../tools/readFileTool")

			;(isBinaryFile as jest.Mock).mockResolvedValue(true)
			;(extractTextFromFile as jest.Mock).mockResolvedValue("PDF content")
			;(countFileLines as jest.Mock).mockResolvedValue(1000)

			let result: string | undefined
			await readFileTool(
				mockCline,
				toolUse,
				mockCline.ask,
				jest.fn(),
				(r: string) => {
					result = r
				},
				(param: string, value: string) => value,
			)

			expect(result).toBe(
				`<files>\n<file><path>${filePath}</path>\n<notice>Binary file</notice>\n</file>\n</files>`,
			)
			expect(extractTextFromFile).not.toHaveBeenCalled()
			expect(readLines).not.toHaveBeenCalled()
			expect(isBinaryFile).toHaveBeenCalledWith(fullPath)
		})
	})

	describe("Error Handling", () => {
		it("should handle missing path parameter", async () => {
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
				jest.fn(),
				(r: string) => {
					result = r
				},
				(param: string, value: string) => value,
			)

			expect(result).toContain("<error>")
			expect(mockCline.recordToolError).toHaveBeenCalled()
		})

		it("should handle file read errors", async () => {
			// Setup
			mockedCountFileLines.mockRejectedValue(new Error("File not found"))
			mockedReadLines.mockRejectedValue(new Error("File not found"))
			mockedExtractTextFromFile.mockRejectedValue(new Error("File not found"))

			const toolUse: ReadFileToolUse = {
				type: "tool_use",
				name: "read_file",
				params: {
					args: `<file><path>nonexistent.txt</path></file>`,
				},
				partial: false,
			}

			const { readFileTool } = require("../tools/readFileTool")

			let result: string | undefined
			await readFileTool(
				mockCline,
				toolUse,
				mockCline.ask,
				jest.fn(),
				(r: string) => {
					result = r
				},
				(param: string, value: string) => value,
			)

			expect(result).toBe(
				`<files>\n<file><path>nonexistent.txt</path><error>Error reading file: File not found</error></file>\n</files>`,
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

			;(countFileLines as jest.Mock).mockRejectedValue(new Error("Line counting failed"))

			let result: string | undefined
			await readFileTool(
				mockCline,
				toolUse,
				mockCline.ask,
				jest.fn(),
				(r: string) => {
					result = r
				},
				(param: string, value: string) => value,
			)

			expect(result).toBe(
				`<files>\n<file><path>error.txt</path><error>Error reading file: Line counting failed</error></file>\n</files>`,
			)
		})

		it("should handle errors in source code definition parsing", async () => {
			const toolUse: ReadFileToolUse = {
				type: "tool_use",
				name: "read_file",
				params: {
					args: `<file><path>src/code.ts</path></file>`,
				},
				partial: false,
			}

			const { readFileTool } = require("../tools/readFileTool")

			;(parseSourceCodeDefinitionsForFile as jest.Mock).mockRejectedValue(new Error("Parser error"))
			;(countFileLines as jest.Mock).mockResolvedValue(1000)

			let result: string | undefined
			await readFileTool(
				mockCline,
				toolUse,
				mockCline.ask,
				jest.fn(),
				(r: string) => {
					result = r
				},
				(param: string, value: string) => value,
			)

			expect(result).toBe(
				`<files>\n<file><path>src/code.ts</path><error>Error reading file: Parser error</error></file>\n</files>`,
			)
		})

		describe("User Feedback Handling", () => {
			it("should handle approval with feedback", async () => {
				const toolUse: ReadFileToolUse = {
					type: "tool_use",
					name: "read_file",
					params: {
						args: `<file><path>src/app.ts</path></file>`,
					},
					partial: false,
				}

				const { readFileTool } = require("../tools/readFileTool")

				;(countFileLines as jest.Mock).mockResolvedValue(10)
				;(readLines as jest.Mock).mockResolvedValue("Test content")
				;(addLineNumbers as jest.Mock).mockReturnValue("1 | Test content")
				mockCline.ask.mockResolvedValueOnce({
					response: "yesButtonClicked",
					text: "Looks good!",
					images: ["image1.png"],
				})

				let result: string | undefined
				await readFileTool(
					mockCline,
					toolUse,
					mockCline.ask,
					jest.fn(),
					(r: string) => {
						result = r
					},
					(param: string, value: string) => value,
				)

				const expectedXml = `<files>\n<file><path>src/app.ts</path>\n<content lines="1-10">\n1 | Test content</content>\n</file>\n</files>`
				expect(result).toBe(
					`The tool was approved with feedback:\n<feedback>\nLooks good!\n</feedback>\n${expectedXml}`,
				)
				expect(mockCline.say).toHaveBeenCalledWith("user_feedback", "Looks good!", ["image1.png"])
			})

			it("should handle denial with feedback", async () => {
				const toolUse: ReadFileToolUse = {
					type: "tool_use",
					name: "read_file",
					params: {
						args: `<file><path>src/app.ts</path></file>`,
					},
					partial: false,
				}

				const { readFileTool } = require("../tools/readFileTool")

				mockCline.ask.mockResolvedValueOnce({
					response: "noButtonClicked",
					text: "Not allowed",
					images: ["image2.png"],
				})

				let result: string | undefined
				await readFileTool(
					mockCline,
					toolUse,
					mockCline.ask,
					jest.fn(),
					(r: string) => {
						result = r
					},
					(param: string, value: string) => value,
				)

				const expectedXml = `<files>\n<file><path>src/app.ts</path><status>Denied by user</status></file>\n</files>`
				expect(result).toBe(
					`The user denied this operation and provided the following feedback:\n<feedback>\nNot allowed\n</feedback>\n${expectedXml}`,
				)
				expect(mockCline.say).toHaveBeenCalledWith("user_feedback", "Not allowed", ["image2.png"])
				expect(mockCline.didRejectTool).toBe(true)
			})
		})

		describe("Invalid Line Range Validation", () => {
			it("should handle end line less than start line", async () => {
				const toolUse: ReadFileToolUse = {
					type: "tool_use",
					name: "read_file",
					params: {
						args: `<file><path>src/app.ts</path><line_range>10-5</line_range></file>`,
					},
					partial: false,
				}

				const { readFileTool } = require("../tools/readFileTool")

				;(countFileLines as jest.Mock).mockResolvedValue(10)
				;(readLines as jest.Mock).mockRejectedValue(
					new Error("Invalid line range: end line cannot be less than start line"),
				)
				mockCline.ask.mockResolvedValueOnce({ response: "yesButtonClicked" })

				let result: string | undefined
				await readFileTool(
					mockCline,
					toolUse,
					mockCline.ask,
					jest.fn(),
					(r: string) => {
						result = r
					},
					(param: string, value: string) => value,
				)

				expect(result).toBe(
					`<files>\n<file><path>src/app.ts</path><error>Error reading file: Invalid line range: end line cannot be less than start line</error></file>\n</files>`,
				)
			})

			it("should handle NaN line values", async () => {
				const toolUse: ReadFileToolUse = {
					type: "tool_use",
					name: "read_file",
					params: {
						args: `<file><path>src/app.ts</path><line_range>abc-def</line_range></file>`,
					},
					partial: false,
				}

				const { readFileTool } = require("../tools/readFileTool")

				;(countFileLines as jest.Mock).mockResolvedValue(10)
				;(readLines as jest.Mock).mockRejectedValue(new Error("Invalid line range values"))
				mockCline.ask.mockResolvedValueOnce({ response: "yesButtonClicked" })

				let result: string | undefined
				await readFileTool(
					mockCline,
					toolUse,
					mockCline.ask,
					jest.fn(),
					(r: string) => {
						result = r
					},
					(param: string, value: string) => value,
				)

				expect(result).toBe(
					`<files>\n<file><path>src/app.ts</path><error>Error reading file: Invalid line range values</error></file>\n</files>`,
				)
			})
		})

		describe("Multiple File States", () => {
			it("should handle mixed approval states", async () => {
				const toolUse: ReadFileToolUse = {
					type: "tool_use",
					name: "read_file",
					params: {
						args: `<file><path>src/app.ts</path></file><file><path>src/blocked.ts</path></file>`,
					},
					partial: false,
				}

				const { readFileTool } = require("../tools/readFileTool")

				;(countFileLines as jest.Mock).mockResolvedValue(10)

				// First file approved
				mockCline.ask.mockResolvedValueOnce({
					response: "yesButtonClicked",
					text: "First approved",
				})

				// Second file denied
				mockCline.ask.mockResolvedValueOnce({
					response: "noButtonClicked",
					text: "Second denied",
				})

				let result: string | undefined
				await readFileTool(
					mockCline,
					toolUse,
					mockCline.ask,
					jest.fn(),
					(r: string) => {
						result = r
					},
					(param: string, value: string) => value,
				)

				const expectedXml = `<files>\n<file><path>src/app.ts</path>\n<content lines="1-10">\n1 | Test content</content>\n</file>\n<file><path>src/blocked.ts</path><status>Denied by user</status></file>\n</files>`
				expect(result).toBe(
					`The user denied this operation and provided the following feedback:\n<feedback>\nSecond denied\n</feedback>\n${expectedXml}`,
				)
				expect(mockCline.didRejectTool).toBe(true)
			})
		})
	})

	describe("Performance Edge Cases", () => {
		it("should handle very large files efficiently", async () => {
			const toolUse: ReadFileToolUse = {
				type: "tool_use",
				name: "read_file",
				params: {
					args: `<file><path>huge.log</path></file>`,
				},
				partial: false,
			}

			const { readFileTool } = require("../tools/readFileTool")

			;(countFileLines as jest.Mock).mockResolvedValue(1000000)
			;(readLines as jest.Mock).mockResolvedValue("First 500 lines")
			;(addLineNumbers as jest.Mock).mockReturnValue("1 | First 500 lines")
			mockCline.ask.mockResolvedValueOnce({
				response: "yesButtonClicked",
				text: "Looks good!",
				images: ["image1.png"],
			})

			let result: string | undefined
			await readFileTool(
				mockCline,
				toolUse,
				mockCline.ask,
				jest.fn(),
				(r: string) => {
					result = r
				},
				(param: string, value: string) => value,
			)

			const expectedXml = `<files>\n<file><path>huge.log</path>\n<content lines="1-500">\n1 | First 500 lines</content>\n<notice>Showing only 500 of 1000000 total lines. Use line_range if you need to read more lines</notice>\n</file>\n</files>`
			expect(result).toBe(
				`The tool was approved with feedback:\n<feedback>\nLooks good!\n</feedback>\n${expectedXml}`,
			)
			expect(extractTextFromFile).not.toHaveBeenCalled()
			expect(readLines).toHaveBeenCalled()
		})

		it("should handle files with very long lines", async () => {
			const toolUse: ReadFileToolUse = {
				type: "tool_use",
				name: "read_file",
				params: {
					args: `<file><path>longlines.txt</path></file>`,
				},
				partial: false,
			}

			const { readFileTool } = require("../tools/readFileTool")

			const longLine = "x".repeat(10000)
			;(countFileLines as jest.Mock).mockResolvedValue(10)
			;(extractTextFromFile as jest.Mock).mockResolvedValue(longLine)
			;(addLineNumbers as jest.Mock).mockImplementation((text) => `1 | ${text}`)

			let result: string | undefined
			await readFileTool(
				mockCline,
				toolUse,
				mockCline.ask,
				jest.fn(),
				(r: string) => {
					result = r
				},
				(param: string, value: string) => value,
			)

			expect(result).toContain(longLine)
			expect(result).toContain('lines="1-10"')
		})
	})
})
