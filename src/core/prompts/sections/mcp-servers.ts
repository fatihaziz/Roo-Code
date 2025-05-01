import { DiffStrategy } from "../../../shared/tools"
import { McpHub } from "../../../services/mcp/McpHub"

export async function getMcpServersSection(
	mcpHub?: McpHub,
	diffStrategy?: DiffStrategy,
	enableMcpServerCreation?: boolean,
): Promise<string> {
	if (!mcpHub) return ""
	const connectedServers =
		mcpHub.getServers().length > 0
			? mcpHub
					.getServers()
					.filter((server) => server.status === "connected")
					.map((server) => {
						const tools = server.tools
							?.map((tool) => {
								const schemaStr = tool.inputSchema
									? `    Input Schema:\n    ${JSON.stringify(tool.inputSchema, null, 2).split("\n").join("\n    ")}`
									: ""
								return `- ${tool.name}: ${tool.description}\n${schemaStr}`
							})
							.join("\n\n")
						const templates = server.resourceTemplates
							?.map((template) => `- ${template.uriTemplate} (${template.name}): ${template.description}`)
							.join("\n")
						const resources = server.resources
							?.map((resource) => `- ${resource.uri} (${resource.name}): ${resource.description}`)
							.join("\n")
						const config = JSON.parse(server.config)
						return (
							`## ${server.name} (\`${config.command}${config.args && Array.isArray(config.args) ? ` ${config.args.join(" ")}` : ""}\`)` +
							(tools ? `\n\n### Tools\n${tools}` : "") +
							(templates ? `\n\n### Resource Templates\n${templates}` : "") +
							(resources ? `\n\n### Resources\n${resources}` : "")
						)
					})
					.join("\n\n")
			: "(No MCP servers connected)"

	let section = `MCP SERVERS

- Model Context Protocol (MCP) lets you use remote/local servers for extra tools/resources.
- Connected servers: use use_mcp_tool, access_mcp_resource.
${connectedServers}
`
	if (!enableMcpServerCreation) return section
	return (
		section +
		`
## Creating an MCP Server
- To add a new tool/server, get instructions via:
<fetch_instructions>
<task>create_mcp_server</task>
</fetch_instructions>
`
	)
}
