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

- Tools: CLI, list_files, search_files, read_file, write_to_file, insert_content, search_and_replace, list_code_definition_names, ask_followup_question${supportsComputerUse ? ", browser_action" : ""}${mcpHub ? ", MCP servers" : ""}.
- On task start, you get a recursive file list from '${cwd}' in environment_details. Use it to infer structure, file types, dependencies. Use list_files for further exploration.
- Use search_files for regex/code search with context. Use list_code_definition_names for structure. Use read_file for details. Edit via ${diffStrategy ? "apply_diff or write_to_file" : "write_to_file"} for bulk, insert_content for lines, search_and_replace for patterns.
- Use execute_command for CLI ops. Prefer complex CLI over scripts. Provide command explanation. Each command runs in a new terminal. Interactive/long-running allowed.
${supportsComputerUse ? "- browser_action: Automate browser (Puppeteer) for web tasks, e.g. verify UI, interact, screenshot, debug. Use after major changes or for troubleshooting." : ""}
${mcpHub ? "- MCP: Use server tools/resources via use_mcp_tool/access_mcp_resource. Each server may expose different capabilities." : ""}
`
}
