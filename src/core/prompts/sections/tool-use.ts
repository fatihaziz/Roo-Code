export function getSharedToolUseSection(): string {
	return `====
# TOOL USE
| # | Rule |
|---|------|
| 1 | Every reply must use exactly 1 TOOL per reply |
| 2 | Format: XML tags, tool name as tag, params as subtags |
| 3 | Example: <read_file><path>src/main.js</path></read_file> |
| 4 | Wait for user result |
| 5 | Only TOOL XML output |
| 6 | CRITICAL: NEVER stop until complete ALL relevant files modifications before \`attempt_completion\`

Strictly adhere to this format for all responses.`
}
