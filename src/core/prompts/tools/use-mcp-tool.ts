import { ToolArgs } from "./types"

export function getUseMcpToolDescription(args: ToolArgs): string | undefined {
	if (!args.mcpHub) {
		return undefined
	}
	return `## use_mcp_tool
Description: Use a tool provided by a connected MCP server. Servers provide tools with different capabilities and input schemas.
Parameters:
| Parameter   | Type   | Required | Description |
|-------------|--------|----------|-------------|
| server_name | string | Yes      | Name of the MCP server providing the tool. |
| tool_name   | string | Yes      | Name of the tool to execute. |
| arguments   | JSON   | Yes      | JSON object with tool input parameters (follows tool's input schema). |
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

Example: Requesting to use an MCP tool

<use_mcp_tool>
<server_name>weather-server</server_name>
<tool_name>get_forecast</tool_name>
<arguments>
{
  "city": "San Francisco",
  "days": 5
}
</arguments>
</use_mcp_tool>
`
}
