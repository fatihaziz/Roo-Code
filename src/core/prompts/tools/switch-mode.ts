export function getSwitchModeDescription(): string {
	return `## switch_mode
Description: Request to switch to a different mode. Allows modes to request switching when needed (e.g., to Code mode for changes). User MUST approve the switch.

Parameters:
| Field | Required | Description |
| - | - | - |
| mode_slug | Yes | Slug of target mode (e.g., "code", "ask"). |
| reason | Optional | Justification for switching modes. |

Usage:
<switch_mode>
<mode_slug>Mode slug here</mode_slug>
<reason>Reason for switching here (optional)</reason>
</switch_mode>

Example: Switch to code mode
<switch_mode>
<mode_slug>code</mode_slug>
<reason>Need to make code changes</reason>
</switch_mode>`
}
