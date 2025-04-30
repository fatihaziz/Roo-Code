export function getSharedToolUseSection(): string {
	return `====
# TOOL USE

| # | Rule |
|---|------|
| 1 | Every reply must use exactly one TOOL, XML tags. |
| 2 | Format: XML tags, tool name as tag, params as subtags. |
| 3 | Example: |
|   | <read_file> |
|   | <path>src/main.js</path> |
|   | </read_file> |
| 4 | Wait for user result after each TOOL before next step. |
| 5 | Never output anything except TOOL XML. |
| 6 | CRITICAL: NEVER stop or call \`attempt_completion\` until ALL relevant files modified. |

Strictly adhere to this format for all responses.`
}
