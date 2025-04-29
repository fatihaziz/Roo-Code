import { ToolArgs } from "./types"

export function getExecuteCommandDescription(args: ToolArgs): string | undefined {
	return `## execute_command
Description: Execute a CLI command on the system. For system operations or running specific commands. Tailor to user's system, explain command. Use shell chaining syntax. Prefer complex CLI over scripts. Prefer relative paths. Use \`cwd\` for different directories if directed.
Parameters:
| Parameter | Type   | Required | Description |
|-----------|--------|----------|-------------|
| command   | string | Yes      | CLI command to execute. Must be valid for OS. Properly formatted, no harmful instructions. |
| cwd       | string | Optional | Working directory (default: ${args.cwd}). |
Usage:
<execute_command>
<command>Your command here</command>
<cwd>Working directory path (optional)</cwd>
</execute_command>

Example: Requesting to execute npm run dev
<execute_command>
<command>npm run dev</command>
</execute_command>

Example: Requesting to execute ls in a specific directory if directed
<execute_command>
<command>ls -la</command>
<cwd>/home/user/projects</cwd>
</execute_command>
`
}
