import { ToolArgs } from "./types"

export function getAccessMcpResourceDescription(args: ToolArgs): string | undefined {
	if (!args.mcpHub) return undefined

	return `## access_mcp_resource
Description: Request resource access (e.g., file, API response) from connected MCP server.
Parameters:
| Field | Required | Description |
| - | - | - |
| server_name | Yes | MCP server name. |
| uri | Yes | Resource URI. |
Usage:
<access_mcp_resource>
<server_name>server name here</server_name>
<uri>resource URI here</uri>
</access_mcp_resource>

Example: Access weather data
<access_mcp_resource>
<server_name>weather-server</server_name>
<uri>weather://san-francisco/current</uri>
</access_mcp_resource>`
}
