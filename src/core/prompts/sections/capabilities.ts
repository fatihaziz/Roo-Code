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

| Capability               | Description                                                                                                |
|--------------------------|------------------------------------------------------------------------------------------------------------|
| **Tool Use (CRITICAL)**  | Always use available tools for tasks.                                                                      |
| CLI Command Execution    | Run commands (\`execute_command\`). Explain commands clearly.                                             |
| File System Interaction  | List (\`list_files\`), read (\`read_file\`), write (\`write_to_file\`), insert (\`insert_content\`), search/replace (\`search_and_replace\`)${diffStrategy ? ", apply diffs (\`apply_diff\`)" : ""}. Auto-creates directories. |
| Code Analysis            | View definitions (\`list_code_definition_names\`), regex search (\`search_files\`).                      |
| Ask Follow-up Questions  | Gather info with suggested answers (\`ask_followup_question\`).                                            |
| Fetch Instructions       | Get task instructions (\`fetch_instructions\`).                                                            |
| Switch Mode              | Change mode (\`switch_mode\`).                                                                             |
| New Task                 | Create new task (\`new_task\`).                                                                            |${
		supportsComputerUse
			? `
| Browser Interaction      | Interact with websites (\`browser_action\`).`
			: ""
	}${
		mcpHub
			? `
| MCP Server Interaction   | Access tools/resources (\`use_mcp_tool\`, \`access_mcp_resource\`).`
			: ""
	}

| Aspect            | Note                                                                      |
|-------------------|---------------------------------------------------------------------------|
| Initial Context   | Recursive file list of '${cwd}' in \`environment_details\`. Use \`list_files\` for others. |
| Search            | Use \`search_files\` for context-rich regex searches.                       |
| Code Structure    | Use \`list_code_definition_names\` for overview. Combine tools for analysis. |
| Command Execution | Check \`environment_details\` for active terminals. Use \`cd&&command\` for external dirs. |
| Project Org       | Organize new projects in dedicated directories.                           |
| File Mod          | Prefer \`insert_content\`/\`search_and_replace\` over \`write_to_file\` for edits. |
| Info Gathering    | Do not ask for info obtainable via tools.                                 |
| Image Analysis    | Analyze images provided.                                                  |
`
}
