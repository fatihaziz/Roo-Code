import { ToolArgs } from "./types"

export function getUseMcpToolDescription(args: ToolArgs): string | undefined {
	if (!args.mcpHub) return undefined

	return `## use_mcp_tool
Description: Execute a tool from a connected MCP server. Each server offers tools with specific capabilities and input schemas.

Parameters:
| Field | Required | Description |
| - | - | - |
| server_name | Yes | MCP server name. |
| tool_name | Yes | Tool name to execute on the specified server. |
| arguments | Yes | JSON object containing tool input parameters, matching tool schema. |

Usage:
<use_mcp_tool>
<server_name>server name here</server_name>
<tool_name>tool name here</tool_name>
<arguments>
{
  "param1": "value1",
  "param2": "value2"
}
</arguments>
</use_mcp_tool>

Example: Use weather forecast tool
<use_mcp_tool>
<server_name>weather-server</server_name>
<tool_name>get_forecast</tool_name>
<arguments>
{
  "city": "San Francisco",
  "days": 5
}
</arguments>
</use_mcp_tool>`
}
