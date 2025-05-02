import { ToolArgs } from "./types"

export function getExecuteCommandDescription(args: ToolArgs): string | undefined {
	return `## execute_command
Description: Execute a CLI command on the system for operations or task steps.

**CRITICAL RULES:**
1.  **Tailor Command:** You MUST adapt the command to the user's OS/shell. Explain its function clearly.
2.  **Chaining:** Use correct shell syntax (e.g., \`&&\`, \`;\`) for multiple commands.
3.  **Prefer CLI:** Use complex CLI commands over scripts for flexibility.
4.  **Relative Paths:** MANDATORY: Use relative paths (e.g., \`./data/file.txt\`, \`go test ./...\`) for consistency. Avoid absolute paths unless necessary.
5.  **Working Directory:** Use \`cwd\` param ONLY if user explicitly directs a different execution directory. Default is workspace root (${args.cwd}).

Parameters:
| Field | Required | Description |
| - | - | - |
| command | Yes | CLI command. MUST be valid for OS. No harmful instructions. |
| cwd | Optional | Working directory (default: ${args.cwd}). Use only when directed. |

Usage:
<execute_command>
<command>Your command here</command>
<cwd>Working directory path (optional)</cwd>
</execute_command>

Example: Run dev server
<execute_command>
<command>npm run dev</command>
</execute_command>

Example: List files in specific directory (if directed)
<execute_command>
<command>ls -la</command>
<cwd>/home/user/projects</cwd>
</execute_command>`
}
