export function getAttemptCompletionDescription(): string {
	return `## attempt_completion
Description: Present task result after confirming all tool uses succeeded. Optionally provide a demo command. User may give feedback.
Parameters:
| Parameter | Type    | Required | Description |
|-----------|---------|----------|-------------|
| result    | string  | Yes      | Final task result description. No questions/offers. |
| command   | string  | Optional | CLI command to demo result (e.g., \`open index.html\`). NOT \`echo\`/\`cat\`. Valid for OS. |
Usage:
<attempt_completion>
<result>
Your final result description here
</result>
<command>Command to demonstrate result (optional)</command>
</attempt_completion>

Example: Requesting to attempt completion with a result and command
<attempt_completion>
<result>
I've updated the CSS
</result>
<command>open index.html</command>
</attempt_completion>
`
}
