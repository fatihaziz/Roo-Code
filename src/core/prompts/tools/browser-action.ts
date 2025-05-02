import { ToolArgs } from "./types"

export function getBrowserActionDescription(args: ToolArgs): string | undefined {
	if (!args.supportsComputerUse) return undefined

	return `## browser_action
Description: Interact with Puppeteer browser. Each action (except \`close\`) returns screenshot + logs. MANDATORY: One action per message; wait for response.

**CRITICAL RULES:**
1.  **Sequence:** You MUST start with \`launch\`, end with \`close\`. For new URLs unreachable via navigation, \`close\` then \`launch\` again.
2.  **Active Browser:** Only \`browser_action\` tool is permitted while browser is active. You MUST \`close\` browser before using other tools (e.g., file edits).
3.  **Resolution:** Viewport is ${args.browserViewportSize}. Click coordinates MUST be within this range.
4.  **Clicks:** Target element CENTER based on screenshot coordinates.

Parameters:
| Field      | Required | Description                                                                 | Example                               |
|------------|----------|-----------------------------------------------------------------------------|---------------------------------------|
| action     | Yes      | One of: launch, hover, click, type, resize, scroll_down, scroll_up, close | \`<action>launch</action>\`             |
| url        | Optional | URL for \`launch\`. MUST be valid (http://, file:///). Required by \`launch\`. | \`<url>http://localhost:3000</url>\`   |
| coordinate | Optional | x,y for \`click\`, \`hover\`. Within ${args.browserViewportSize}. Required by \`click\`, \`hover\`. | \`<coordinate>450,300</coordinate>\` |
| size       | Optional | w,h for \`resize\`. Required by \`resize\`.                               | \`<size>1280,720</size>\`              |
| text       | Optional | String for \`type\`. Required by \`type\`. Use after clicking input field. | \`<text>Input text</text>\`            |

Usage:
<browser_action>
<action>action_name</action>
<!-- Include required params based on action -->
</browser_action>

Example: Launch browser
<browser_action>
<action>launch</action>
<url>https://example.com</url>
</browser_action>

Example: Click element
<browser_action>
<action>click</action>
<coordinate>450,300</coordinate>
</browser_action>`
}
