import fs from "fs/promises"
import path from "path"
import { Mode } from "../../../shared/modes"
import { fileExistsAtPath } from "../../../utils/fs"

export type PromptVariables = {
	workspace?: string
	mode?: string
	language?: string
	shell?: string
	operatingSystem?: string
}

function interpolatePromptContent(content: string, variables: PromptVariables): string {
	let interpolatedContent = content
	for (const key in variables) {
		if (
			Object.prototype.hasOwnProperty.call(variables, key) &&
			variables[key as keyof PromptVariables] !== undefined
		) {
			const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, "g")
			interpolatedContent = interpolatedContent.replace(placeholder, variables[key as keyof PromptVariables]!)
		}
	}
	return interpolatedContent
}

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

export function getSystemPromptFilePath(cwd: string, mode: Mode): string {
	return path.join(cwd, ".roo", `system-prompt-${mode}`)
}

export async function loadSystemPromptFile(cwd: string, mode: Mode, variables: PromptVariables): Promise<string> {
	const filePath = getSystemPromptFilePath(cwd, mode)
	const rawContent = await safeReadFile(filePath)
	if (!rawContent) return ""
	return interpolatePromptContent(rawContent, variables)
}

export async function ensureRooDirectory(cwd: string): Promise<void> {
	const rooDir = path.join(cwd, ".roo")
	if (await fileExistsAtPath(rooDir)) return
	try {
		await fs.mkdir(rooDir, { recursive: true })
	} catch (err) {
		const errorCode = (err as NodeJS.ErrnoException).code
		if (errorCode !== "EEXIST") throw err
	}
}
