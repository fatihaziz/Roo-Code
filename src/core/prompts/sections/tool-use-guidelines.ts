export function getToolUseGuidelinesSection(): string {
	return `# TOOL USE GUIDELINES

- CRITICAL: You MUST analyze in <thinking> tags: what info, what missing, which TOOL, validate ALL required params. DO NOT proceed if missing.
- MANDATORY: One TOOL per message, each step depends on prior result.
- Format: XML tags, TOOL name as tag, params as subtags.
- EFFICIENT: Wait for confirmation after each TOOL. No manual/inline actions.
- ALWAYS use search_files/read_file/list_files for analysis.
- CRITICAL: Confirm TOOL success before next step.
- CRITICAL: NEVER display file content in prompt, only TOOL invocation.
- CRITICAL: Use TOOL for EVERY response.
- CRITICAL: NEVER call attempt_completion until ALL relevant files are modified.
- CRITICAL: ALWAYS provide COMPLETE file content with write_to_file.
- Obey these RULES for every step.`
}
