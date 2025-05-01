import path from "path"
import { isBinaryFile } from "isbinaryfile"

import { Cline } from "../Cline"
import { ClineSayTool } from "../../shared/ExtensionMessage"
import { formatResponse } from "../prompts/responses"
import { t } from "../../i18n"
import { ToolUse, AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../../shared/tools"
import { RecordSource } from "../context-tracking/FileContextTrackerTypes"
import { isPathOutsideWorkspace } from "../../utils/pathUtils"
import { getReadablePath } from "../../utils/path"
import { countFileLines } from "../../integrations/misc/line-counter"
import { readLines } from "../../integrations/misc/read-lines"
import { extractTextFromFile, addLineNumbers } from "../../integrations/misc/extract-text"
import { parseSourceCodeDefinitionsForFile } from "../../services/tree-sitter"
import { parseXml } from "../../utils/xml"

// Types
interface LineRange {
	start: number
	end: number
}

interface FileEntry {
	path?: string
	lineRanges?: LineRange[]
}

export async function readFileTool(
	cline: Cline,
	block: ToolUse,
	askApproval: AskApproval,
	handleError: HandleError,
	pushToolResult: PushToolResult,
	_removeClosingTag: RemoveClosingTag,
) {
	const argsXmlTag: string | undefined = block.params.args

	// Handle partial message first
	if (block.partial) {
		let filePath = ""
		if (argsXmlTag) {
			const match = argsXmlTag.match(/<file>.*?<path>([^<]+)<\/path>/s)
			if (match) {
				filePath = match[1]
			}
		}

		const fullPath = filePath ? path.resolve(cline.cwd, filePath) : ""
		const sharedMessageProps: ClineSayTool = {
			tool: "readFile",
			path: getReadablePath(cline.cwd, filePath),
			isOutsideWorkspace: filePath ? isPathOutsideWorkspace(fullPath) : false,
		}
		const partialMessage = JSON.stringify({
			...sharedMessageProps,
			content: undefined,
		} satisfies ClineSayTool)
		await cline.ask("tool", partialMessage, block.partial).catch(() => {})
		return
	}

	if (!argsXmlTag) {
		cline.consecutiveMistakeCount++
		cline.recordToolError("read_file")
		const errorMsg = await cline.sayAndCreateMissingParamError("read_file", "args")
		pushToolResult(`<files><error>${errorMsg}</error></files>`)
		return
	}

	// Parse file entries from XML
	const fileEntries: FileEntry[] = []
	try {
		const parsed = parseXml(argsXmlTag) as any
		const files = Array.isArray(parsed.file) ? parsed.file : [parsed.file].filter(Boolean)

		console.log("Parsed files:", files)

		for (const file of files) {
			if (!file.path) continue

			const fileEntry: FileEntry = {
				path: file.path,
				lineRanges: [],
			}

			// Handle line ranges
			if (file.line_range) {
				const ranges = Array.isArray(file.line_range) ? file.line_range : [file.line_range]
				for (const range of ranges) {
					const match = range.match(/(\d+)-(\d+)/)
					if (match) {
						const [, start, end] = match.map(Number)
						if (!isNaN(start) && !isNaN(end)) {
							fileEntry.lineRanges?.push({ start, end })
						}
					}
				}
			}

			fileEntries.push(fileEntry)
		}
	} catch (error) {
		throw new Error(`Failed to parse read_file XML: ${error instanceof Error ? error.message : String(error)}`)
	}

	if (fileEntries.length === 0) {
		cline.consecutiveMistakeCount++
		cline.recordToolError("read_file")
		const errorMsg = await cline.sayAndCreateMissingParamError("read_file", "args")
		pushToolResult(`<files><error>${errorMsg}</error></files>`)
		return
	}

	const results: string[] = []

	try {
		// First validate all files and get approvals
		const blockedFiles = new Set<string>()
		const approvedFiles = new Set<string>()

		for (const entry of fileEntries) {
			const relPath = entry.path || ""
			const fullPath = path.resolve(cline.cwd, relPath)

			// Validate line ranges first
			if (entry.lineRanges) {
				for (const range of entry.lineRanges) {
					if (range.start > range.end) {
						await handleFileError(
							new Error("Invalid line range: end line cannot be less than start line"),
							relPath,
							fileEntries.length === 1,
							results,
							handleError,
						)
						blockedFiles.add(relPath)
						break
					}
					if (isNaN(range.start) || isNaN(range.end)) {
						await handleFileError(
							new Error("Invalid line range values"),
							relPath,
							fileEntries.length === 1,
							results,
							handleError,
						)
						blockedFiles.add(relPath)
						break
					}
				}
			}

			// Then check RooIgnore validation
			if (!blockedFiles.has(relPath)) {
				const accessAllowed = cline.rooIgnoreController?.validateAccess(relPath)
				if (!accessAllowed) {
					await cline.say("rooignore_error", relPath)
					const errorMsg = formatResponse.rooIgnoreError(relPath)
					results.push(`<file><path>${relPath}</path><error>${errorMsg}</error></file>`)
					blockedFiles.add(relPath)
					continue
				}

				// Get approval for valid files
				const isOutsideWorkspace = isPathOutsideWorkspace(fullPath)
				const { maxReadFileLine = 500 } = (await cline.providerRef.deref()?.getState()) ?? {}

				// Create line snippet for approval message
				let lineSnippet = ""
				if (entry.lineRanges && entry.lineRanges.length > 0) {
					const ranges = entry.lineRanges.map((range) =>
						t("tools:readFile.linesRange", { start: range.start, end: range.end }),
					)
					lineSnippet = ranges.join(", ")
				} else if (maxReadFileLine === 0) {
					lineSnippet = t("tools:readFile.definitionsOnly")
				} else if (maxReadFileLine > 0) {
					lineSnippet = t("tools:readFile.maxLines", { max: maxReadFileLine })
				}

				const completeMessage = JSON.stringify({
					tool: "readFile",
					path: getReadablePath(cline.cwd, relPath),
					isOutsideWorkspace,
					content: fullPath,
					reason: lineSnippet,
				} satisfies ClineSayTool)

				const didApprove = await askApproval("tool", completeMessage)
				if (!didApprove) {
					blockedFiles.add(relPath)
				} else {
					approvedFiles.add(relPath)
				}
			}
		}

		// Then process only approved files
		for (const entry of fileEntries) {
			const relPath = entry.path || ""
			const fullPath = path.resolve(cline.cwd, relPath)

			// Skip files that weren't approved
			if (!approvedFiles.has(relPath)) {
				continue
			}

			const { maxReadFileLine = 500 } = (await cline.providerRef.deref()?.getState()) ?? {}

			// Process approved files
			try {
				const [totalLines, isBinary] = await Promise.all([countFileLines(fullPath), isBinaryFile(fullPath)])

				// Handle binary files
				if (isBinary) {
					results.push(`<file><path>${relPath}</path>\n<notice>Binary file</notice>\n</file>`)
					continue
				}

				// Handle range reads (bypass maxReadFileLine)
				if (entry.lineRanges && entry.lineRanges.length > 0) {
					const rangeResults: string[] = []
					for (const range of entry.lineRanges) {
						const content = addLineNumbers(
							await readLines(fullPath, range.end - 1, range.start - 1),
							range.start,
						)
						const lineRangeAttr = ` lines="${range.start}-${range.end}"`
						rangeResults.push(`<content${lineRangeAttr}>\n${content}</content>`)
					}
					results.push(`<file><path>${relPath}</path>\n${rangeResults.join("\n")}\n</file>`)
					continue
				}

				// Handle definitions-only mode
				if (maxReadFileLine === 0) {
					const defResult = await parseSourceCodeDefinitionsForFile(fullPath, cline.rooIgnoreController)
					if (defResult) {
						results.push(
							`<file><path>${relPath}</path>\n<list_code_definition_names>${defResult}</list_code_definition_names>\n</file>`,
						)
					}
					continue
				}

				// Handle files exceeding line threshold
				if (maxReadFileLine > 0 && totalLines > maxReadFileLine) {
					const content = addLineNumbers(await readLines(fullPath, maxReadFileLine - 1, 0))
					const lineRangeAttr = ` lines="1-${maxReadFileLine}"`
					let xmlInfo = `<content${lineRangeAttr}>\n${content}</content>\n`

					const defResult = await parseSourceCodeDefinitionsForFile(fullPath, cline.rooIgnoreController)
					if (defResult) {
						xmlInfo += `<list_code_definition_names>${defResult}</list_code_definition_names>\n`
					}
					xmlInfo += `<notice>Showing only ${maxReadFileLine} of ${totalLines} total lines. Use line_range if you need to read more lines</notice>\n`
					results.push(`<file><path>${relPath}</path>\n${xmlInfo}</file>`)
					continue
				}

				// Handle normal file read
				const content = await extractTextFromFile(fullPath)
				const lineRangeAttr = ` lines="1-${totalLines}"`
				let xmlInfo = totalLines > 0 ? `<content${lineRangeAttr}>\n${content}</content>\n` : `<content/>`

				if (totalLines === 0) {
					xmlInfo += `<notice>File is empty</notice>\n`
				}

				// Track file read
				await cline.getFileContextTracker().trackFileContext(relPath, "read_tool" as RecordSource)

				results.push(`<file><path>${relPath}</path>\n${xmlInfo}</file>`)
			} catch (error) {
				await handleFileError(error, relPath, fileEntries.length === 1, results, handleError)
			}
		}

		// Push combined results
		pushToolResult(`<files>\n${results.join("\n")}\n</files>`)
	} catch (error) {
		// Handle all errors using per-file format for consistency
		const relPath = fileEntries[0]?.path || "unknown"
		await handleFileError(error, relPath, false, results, handleError)
		pushToolResult(`<files>\n${results.join("\n")}\n</files>`)
	}
}

// Error handling function
async function handleFileError(
	error: unknown,
	relPath: string,
	isOnlyFile: boolean,
	results: string[],
	handleError: HandleError,
): Promise<void> {
	const errorMsg = error instanceof Error ? error.message : String(error)
	// Always use per-file error format for consistency
	results.push(`<file><path>${relPath}</path><error>Error reading file: ${errorMsg}</error></file>`)
	await handleError(`reading file ${relPath}`, error instanceof Error ? error : new Error(errorMsg))
}
