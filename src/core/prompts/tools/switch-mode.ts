export function getSwitchModeDescription(): string {
	return `## switch_mode
Description: Request to switch to a different mode. Allows modes to request switching when needed (e.g., to Code mode for changes). User must approve.
Parameters:
| Parameter | Type   | Required | Description |
|-----------|--------|----------|-------------|
| mode_slug | string | Yes      | Slug of mode to switch to (e.g., "code", "ask", "architect"). |
| reason    | string | Optional | Reason for switching modes. |
Usage:
<switch_mode>
<mode_slug>Mode slug here</mode_slug>
<reason>Reason for switching here</reason>
</switch_mode>

Example: Requesting to switch to code mode
<switch_mode>
<mode_slug>code</mode_slug>
<reason>Need to make code changes</reason>
</switch_mode>
`
}
