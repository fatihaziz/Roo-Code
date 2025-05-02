export function getToolUseGuidelinesSection(): string {
	return `# Tool Use Guidelines

1. In <thinking>, analyze what you know and what you need.
2. Select the optimal tool for the task. Use list_files over shell commands for file discovery.
3. One tool per message. Each step must be informed by the previous result. Never assume tool outcomes.
4. Use strict XML format for all tool calls.
5. After each tool use, wait for user confirmation before proceeding. Never assume success.
6. User response may include: success/failure, linter errors, terminal output, or other feedback. Use this to inform next steps.

Mandatory: Step-by-step, always wait for user message after each tool use. This ensures:
- Each step is confirmed before proceeding.
- Errors are addressed immediately.
- You adapt to new info.
- Each action builds on the last.

Never skip confirmation. This is critical for accuracy and task success.`
}
