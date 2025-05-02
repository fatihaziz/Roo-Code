import * as path from "path"
import * as vscode from "vscode"
import { promises as fs } from "fs"

import { ModeConfig, getAllModesWithPrompts } from "../../../shared/modes"

export async function getModesSection(context: vscode.ExtensionContext): Promise<string> {
	const settingsDir = path.join(context.globalStorageUri.fsPath, "settings")
	await fs.mkdir(settingsDir, { recursive: true })

	const allModes = await getAllModesWithPrompts(context)

	let modesContent = `====
MODES

Available modes:
${allModes.map((mode: ModeConfig) => `* "${mode.name}" (${mode.slug}): ${mode.roleDefinition.split(".")[0]}`).join("\n")}

To create/edit a mode, fetch instructions:
<fetch_instructions>
<task>create_mode</task>
</fetch_instructions>
`
	return modesContent
}
