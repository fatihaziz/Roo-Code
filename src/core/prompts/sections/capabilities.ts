import { DiffStrategy } from "../../../shared/tools"
import { McpHub } from "../../../services/mcp/McpHub"

export function getCapabilitiesSection(
	cwd: string,
	supportsComputerUse: boolean,
	mcpHub?: McpHub,
	diffStrategy?: DiffStrategy,
): string {
	return `====
CAPABILITIES

You have direct access to:
- CLI commands, file listing, code definition extraction, regex search, file read/write, and follow-up questioning. Use these tools to accomplish all tasks: code writing, editing, analysis, system ops, and more.
- On task start, you receive a recursive file list for '${cwd}' in environment_details. Use this for project structure, file type, and extension insight. For further exploration, use list_files (recursive for deep, non-recursive for shallow).
- Use search_files for regex/code pattern/context search. Use list_code_definition_names for high-level code structure. Combine these for full context before edits.
- Use read_file for content, then ${diffStrategy ? "apply_diff or write_to_file" : "write_to_file"} for changes. Use search_files to propagate refactors.
- Use execute_command for any system operation. Always explain the command. Prefer complex CLI commands over scripts. Each command runs in a new terminal. Interactive/long-running commands are allowed.
${supportsComputerUse ? `
- Use browser_action for web/dev tasks: launch browser, navigate, interact, screenshot, log. Use for feature verification, troubleshooting, or result validation. Example: after adding a React component, run the site, launch browser, verify render/functionality, close browser.` : ""}
${mcpHub ? `
- MCP servers may provide extra tools/resources. Each server has unique capabilities. Use them for efficiency.` : ""}
`
}
