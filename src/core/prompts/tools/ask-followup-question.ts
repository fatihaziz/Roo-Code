export function getAskFollowupQuestionDescription(): string {
	return `## ask_followup_question
Description: Ask user for needed info. Use when ambiguous, need clarification, or more details. Enables interactive problem-solving. Use judiciously to balance info gathering and efficiency.
Parameters:
| Field | Required | Description |
| - | - | - |
| question | Yes | Clear, specific question for needed information. |
| follow_up | Yes | 2-4 suggested answers in <suggest> tags. Specific, actionable, complete answers. NO placeholders. |
Usage:
<ask_followup_question>
<question>Your question here</question>
<follow_up>
<suggest>
Your suggested answer here
</suggest>
</follow_up>
</ask_followup_question>

Example: Requesting path for frontend-config.json
<ask_followup_question>
<question>What is the path to the frontend-config.json file?</question>
<follow_up>
<suggest>./src/frontend-config.json</suggest>
<suggest>./config/frontend-config.json</suggest>
<suggest>./frontend-config.json</suggest>
</follow_up>
</ask_followup_question>`
}
