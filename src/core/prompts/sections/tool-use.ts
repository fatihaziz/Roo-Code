export function getSharedToolUseSection(): string {
	return `====
# TOOL USE
- CRITICAL: You MUST use exactly 1 TOOL per reply.
- MANDATORY: Format is XML tags, TOOL name as tag, params as subtags.
- Example: <read_file><path>src/main.js</path></read_file>
- EFFICIENT: Wait for user result before next TOOL. No extra output.
- Output ONLY TOOL XML, nothing else.
- CRITICAL: NEVER call attempt_completion until ALL relevant files are modified.
Strictly adhere to these RULES for every response.`
}
