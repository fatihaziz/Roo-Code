import { ToolArgs } from "./types"

export function getNewTaskDescription(_args: ToolArgs): string {
	return `## new_task
Description: Create a new task instance. Instructs system to start a new Cline instance with specified mode and initial message.

Parameters:
| Field   | Required | Description                                         |
|---------|----------|-----------------------------------------------------|
| mode    | Yes      | Mode slug for new task (e.g., "code", "ask").       |
| message | Yes      | Initial user message/instructions for the new task. |

Usage:
<new_task>
<mode>your-mode-slug-here</mode>
<message>Your initial instructions here</message>
</new_task>

Example: Start new 'code' task
<new_task>
<mode>code</mode>
<message>Implement feature X.</message>
</new_task>
`
}
