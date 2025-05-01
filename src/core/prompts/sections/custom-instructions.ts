import fs from "fs/promises"
import path from "path"
import { LANGUAGES, isLanguage } from "../../../shared/language"
import { Dirent } from "fs"

async function safeReadFile(filePath: string): Promise<string> {
	try {
		const content = await fs.readFile(filePath, "utf-8")
		return content.trim()
	} catch (err) {
		const errorCode = (err as NodeJS.ErrnoException).code
		if (!errorCode || !["ENOENT", "EISDIR"].includes(errorCode)) throw err
		return ""
	}
}

async function directoryExists(dirPath: string): Promise<boolean> {
	try {
		const stats = await fs.stat(dirPath)
		return stats.isDirectory()
	} catch {
		return false
	}
}

const MAX_DEPTH = 5

async function resolveDirectoryEntry(entry: Dirent, dirPath: string, filePaths: string[], depth: number): Promise<void> {
	if (depth > MAX_DEPTH) return
	const fullPath = path.resolve(entry.parentPath || dirPath, entry.name)
	if (entry.isFile()) filePaths.push(fullPath)
	else if (entry.isSymbolicLink()) await resolveSymLink(fullPath, filePaths, depth + 1)
}

async function resolveSymLink(fullPath: string, filePaths: string[], depth: number): Promise<void> {
	if (depth > MAX_DEPTH) return
	try {
		const linkTarget = await fs.readlink(fullPath)
		const resolvedTarget = path.resolve(path.dirname(fullPath), linkTarget)
		const stats = await fs.stat(resolvedTarget)
		if (stats.isFile()) filePaths.push(resolvedTarget)
		else if (stats.isDirectory()) {
			const anotherEntries = await fs.readdir(resolvedTarget, { withFileTypes: true, recursive: true })
			await Promise.all(anotherEntries.map(e => resolveDirectoryEntry(e, resolvedTarget, filePaths, depth + 1)))
		} else if (stats.isSymbolicLink()) await resolveSymLink(resolvedTarget, filePaths, depth + 1)
	} catch {}
}

async function readTextFilesFromDirectory(dirPath: string): Promise<Array<{ filename: string; content: string }>> {
	try {
		const entries = await fs.readdir(dirPath, { withFileTypes: true, recursive: true })
		const filePaths: string[] = []
		await Promise.all(entries.map(e => resolveDirectoryEntry(e, dirPath, filePaths, 0)))
		const fileContents = await Promise.all(
			filePaths.map(async (file) => {
				try {
					const stats = await fs.stat(file)
					if (stats.isFile()) {
						const content = await safeReadFile(file)
						return { filename: file, content }
					}
				} catch {}
				return null
			})
		)
		return fileContents.filter((item): item is { filename: string; content: string } => item !== null)
	} catch {
		return []
	}
}

function formatDirectoryContent(dirPath: string, files: Array<{ filename: string; content: string }>): string {
	if (!files.length) return ""
	return "\n\n" + files.map(file => `# Rules from ${file.filename}:\n${file.content}`).join("\n\n")
}

export async function loadRuleFiles(cwd: string): Promise<string> {
	const rooRulesDir = path.join(cwd, ".roo", "rules")
	if (await directoryExists(rooRulesDir)) {
		const files = await readTextFilesFromDirectory(rooRulesDir)
		if (files.length > 0) return formatDirectoryContent(rooRulesDir, files)
	}
	for (const file of [".roorules", ".clinerules"]) {
		const content = await safeReadFile(path.join(cwd, file))
		if (content) return `\n# Rules from ${file}:\n${content}\n`
	}
	return ""
}

export async function addCustomInstructions(
	modeCustomInstructions: string,
	globalCustomInstructions: string,
	cwd: string,
	mode: string,
	options: { language?: string; rooIgnoreInstructions?: string } = {},
): Promise<string> {
	const sections = []

	let modeRuleContent = ""
	let usedRuleFile = ""
	if (mode) {
		const modeRulesDir = path.join(cwd, ".roo", `rules-${mode}`)
		if (await directoryExists(modeRulesDir)) {
			const files = await readTextFilesFromDirectory(modeRulesDir)
			if (files.length > 0) {
				modeRuleContent = formatDirectoryContent(modeRulesDir, files)
				usedRuleFile = modeRulesDir
			}
		}
		if (!modeRuleContent) {
			const rooModeRuleFile = `.roorules-${mode}`
			modeRuleContent = await safeReadFile(path.join(cwd, rooModeRuleFile))
			if (modeRuleContent) usedRuleFile = rooModeRuleFile
			else {
				const clineModeRuleFile = `.clinerules-${mode}`
				modeRuleContent = await safeReadFile(path.join(cwd, clineModeRuleFile))
				if (modeRuleContent) usedRuleFile = clineModeRuleFile
			}
		}
	}

	if (options.language) {
		const languageName = isLanguage(options.language) ? LANGUAGES[options.language] : options.language
		sections.push(
			`Language Preference:\nYou should always speak and think in the "${languageName}" (${options.language}) language unless the user gives you instructions below to do otherwise.`
		)
	}
	if (typeof globalCustomInstructions === "string" && globalCustomInstructions.trim())
		sections.push(`Global Instructions:\n${globalCustomInstructions.trim()}`)
	if (typeof modeCustomInstructions === "string" && modeCustomInstructions.trim())
		sections.push(`Mode-specific Instructions:\n${modeCustomInstructions.trim()}`)

	const rules = []
	if (modeRuleContent && modeRuleContent.trim()) {
		if (usedRuleFile.includes(path.join(".roo", `rules-${mode}`))) rules.push(modeRuleContent.trim())
		else rules.push(`# Rules from ${usedRuleFile}:\n${modeRuleContent}`)
	}
	if (options.rooIgnoreInstructions) rules.push(options.rooIgnoreInstructions)
	const genericRuleContent = await loadRuleFiles(cwd)
	if (genericRuleContent && genericRuleContent.trim()) rules.push(genericRuleContent.trim())
	if (rules.length > 0) sections.push(`Rules:\n\n${rules.join("\n\n")}`)

	const joinedSections = sections.join("\n\n")
	return joinedSections
		? `
====
USER'S CUSTOM INSTRUCTIONS

The following additional instructions are provided by the user, and should be followed to the best of your ability without interfering with the TOOL USE guidelines.

${joinedSections}`
		: ""
}
