export function getAskFollowupQuestionDescription(): string {
	return `## ask_followup_question
Description: Ask the user a question to gather additional information needed to complete the task. Use when encountering ambiguities, needing clarification, or requiring more details. Allows interactive problem-solving. Use judiciously.
Parameters:
| Parameter | Type    | Required | Description |
|-----------|---------|----------|-------------|
| question  | string  | Yes      | Clear, specific question for needed information. |
| follow_up | list    | Yes      | 2-4 suggested answers in <suggest> tags. Specific, actionable, complete answers. NO placeholders. |
Usage:
<ask_followup_question>
<question>Your question here</question>
<follow_up>
<suggest>
Your suggested answer here
</suggest>
</follow_up>
</ask_followup_question>

Example: Requesting to ask the user for the path to the frontend-config.json file
<ask_followup_question>
<question>What is the path to the frontend-config.json file?</question>
<follow_up>
<suggest>./src/frontend-config.json</suggest>
<suggest>./config/frontend-config.json</suggest>
<suggest>./frontend-config.json</suggest>
</follow_up>
</ask_followup_question>
`
}
