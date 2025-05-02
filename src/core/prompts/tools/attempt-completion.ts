export function getAttemptCompletionDescription(): string {
	return `## attempt_completion
Description: Present final task result after confirming all tool uses succeeded. Optionally provide a demo command. User may give feedback.

**CRITICAL**: You MUST confirm prior TOOL success via user response before using attempt_completion. Failure risks code corruption. MANDATORY: Verify confirmation in <thinking> before proceeding. DO NOT use this tool otherwise.

Parameters:
| Field | Required | Description |
| - | - | - |
| result | Yes | Final task result description. No questions/offers. |
| command | Optional | CLI command to demo result (e.g., \`open index.html\`). NOT \`echo\`/\`cat\`. Valid for OS. |

Usage:
<attempt_completion>
<result>
Your final result description here
</result>
<command>Command to demonstrate result (optional)</command>
</attempt_completion>

Example: Completion with result and command
<attempt_completion>
<result>
CSS updated successfully.
</result>
<command>open index.html</command>
</attempt_completion>`
}
