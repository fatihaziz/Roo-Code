import { DiffStrategy } from "../../../shared/tools"
import { McpHub } from "../../../services/mcp/McpHub"

export async function getMcpServersSection(
	mcpHub?: McpHub,
	diffStrategy?: DiffStrategy,
	enableMcpServerCreation?: boolean,
): Promise<string> {
	if (!mcpHub) {
		return ""
	}

	const connectedServers =
		mcpHub.getServers().length > 0
			? `| Server Name | Command | Available Tools | Resource Templates | Direct Resources |
|-------------|---------|-----------------|--------------------|------------------|
${mcpHub
	.getServers()
	.filter((server) => server.status === "connected")
	.map((server) => {
		const tools = server.tools?.map((tool) => tool.name).join(", ") || "None"
		const templates = server.resourceTemplates?.map((template) => template.uriTemplate).join(", ") || "None"
		const resources = server.resources?.map((resource) => resource.uri).join(", ") || "None"
		const config = JSON.parse(server.config)
		const command = `${config.command}${config.args && Array.isArray(config.args) ? ` ${config.args.join(" ")}` : ""}`

		return `| ${server.name} | \`${command}\` | ${tools} | ${templates} | ${resources} |`
	})
	.join("\n")}`
			: "(No MCP servers currently connected)"

	const baseSection = `MCP SERVERS

The Model Context Protocol (MCP) extends capabilities via servers.

# Connected MCP Servers

Use \`use_mcp_tool\` for tools, \`access_mcp_resource\` for resources.

${connectedServers}
`

	if (!enableMcpServerCreation) {
		return baseSection
	}

	return (
		baseSection +
		`
## Creating an MCP Server

To create an MCP server, use the fetch_instructions tool:
<fetch_instructions>
<task>create_mcp_server</task>
</fetch_instructions>`
	)
}
