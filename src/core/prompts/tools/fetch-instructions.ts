export function getFetchInstructionsDescription(): string {
	return `## fetch_instructions
Description: Fetch instructions for specific predefined tasks.
Parameters:
| Field | Required | Description                     | Values                          |
|-------|----------|---------------------------------|---------------------------------|
| task  | Yes      | Task to get instructions for. | \`create_mcp_server\`, \`create_mode\` |
Usage:
<fetch_instructions>
<task>task_name_here</task>
</fetch_instructions>

Example: Get MCP Server creation instructions
<fetch_instructions>
<task>create_mcp_server</task>
</fetch_instructions>`
}
