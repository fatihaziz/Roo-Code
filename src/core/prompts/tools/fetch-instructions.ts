export function getFetchInstructionsDescription(): string {
	return `## fetch_instructions
Description: Request to fetch instructions to perform a task.
Parameters:
| Parameter | Type   | Required | Description |
|-----------|--------|----------|-------------|
| task      | string | Yes      | The task to get instructions for (see below). |

Task Values:
| Value             | Description |
|-------------------|-------------|
| create_mcp_server | Get instructions for creating an MCP server. |
| create_mode       | Get instructions for creating a mode. |

Example: Requesting instructions to create an MCP Server

<fetch_instructions>
<task>create_mcp_server</task>
</fetch_instructions>
`
}
