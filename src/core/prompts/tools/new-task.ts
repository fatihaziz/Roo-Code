import { ToolArgs } from "./types"

export function getNewTaskDescription(_args: ToolArgs): string {
	return `## new_task
Description: Create a new task with a specified starting mode and initial message. Instructs the system to create a new Cline instance in the given mode with the provided message.

Parameters:
| Parameter | Type   | Required | Description |
|-----------|--------|----------|-------------|
| mode      | string | Yes      | Slug of mode to start new task in (e.g., "code", "ask", "architect"). |
| message   | string | Yes      | Initial user message or instructions for new task. |

Usage:
<new_task>
<mode>your-mode-slug-here</mode>
<message>Your initial instructions here</message>
</new_task>

Example:
<new_task>
<mode>code</mode>
<message>Implement a new feature for the application.</message>
</new_task>
`
}
