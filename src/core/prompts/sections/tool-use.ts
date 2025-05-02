export function getSharedToolUseSection(): string {
	return `====
TOOL USE

You must use tools. One tool per message. Each tool use is stepwise and must be informed by the previous result.

# Tool Use Format

Use strict XML tags for all tool calls:
<tool_name>
<parameter1_name>value1</parameter1_name>
<parameter2_name>value2</parameter2_name>
...
</tool_name>

Example:
<new_task>
<mode>code</mode>
<message>Implement a new feature for the application.</message>
</new_task>

<new_task>
<mode>code</mode>
<message>Implement a new feature for the application.</message>
</new_task>

Always adhere to this format for the tool use to ensure proper parsing and execution.`
}
