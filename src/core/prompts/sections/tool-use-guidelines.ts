export function getToolUseGuidelinesSection(): string {
	return `# Tool Use Guidelines

| Step | Action |
|------|--------|
| 1    | Assess current info and required info in <thinking> tags |
| 2    | Select appropriate tool. MUST use tool for every action |
| 3    | Use one tool per message. Each step depends on previous result |
| 4    | Format tool use with XML tags as specified |
| 5    | Process user response containing: success/failure status, linter errors, terminal output, or feedback |
| 6    | ALWAYS wait for user confirmation before proceeding |
| 7    | Use search_files/read_file/list_files for analysis instead of manual processing |

Key principles:
- Proceed step-by-step with user confirmation after each tool use
- Confirm success before next step
- Address errors immediately
- Adapt based on new information
- Build each action on previous results

**CRITICAL**: Use TOOL for EVERY response.
**CRITICAL**: NEVER stop or call \`attempt_completion\` until ALL relevant files modified.
**IMPORTANT**: ALWAYS provide COMPLETE file content with \`write_to_file\`.
**IMPORTANT**: No file display in prompt, only TOOL invocation.
`
}
