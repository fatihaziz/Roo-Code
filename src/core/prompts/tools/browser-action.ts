import { ToolArgs } from "./types"

export function getBrowserActionDescription(args: ToolArgs): string | undefined {
	if (!args.supportsComputerUse) {
		return undefined
	}
	return `## browser_action
Description: Interact with a Puppeteer-controlled browser. Each action (except \`close\`) provides a screenshot and console logs. One action per message. Wait for user response (screenshot/logs) before next action.
- Sequence MUST start with \`launch\` and end with \`close\`. Close and re-launch to visit new URLs not navigable from current page.
- Only \`browser_action\` tool usable while browser active. Use other tools AFTER closing browser.
- Browser resolution: **${args.browserViewportSize}**. Coordinates for clicks must be within range.
- Consult screenshot for element coordinates before clicking/hovering. Target center of element.
Parameters:
| Parameter  | Type   | Required | Description |
|------------|--------|----------|-------------|
| action     | string | Yes      | Action to perform (see below). |
| url        | string | Optional | URL for \`launch\` action. Must be valid (http/file protocol). |
| coordinate | string | Optional | X,Y for \`click\`/\`hover\` (e.g., "450,300"). Within **${args.browserViewportSize}**. |
| size       | string | Optional | W,H for \`resize\` (e.g., "1280,720"). |
| text       | string | Optional | Text for \`type\` action. |

Available Actions:
| Action      | Description | Parameters | Notes |
|-------------|-------------|------------|-------|
| launch      | Launch browser at URL. | \`url\` | MUST be first action. |
| hover       | Move cursor to x,y. | \`coordinate\` | Target element center from screenshot. |
| click       | Click at x,y. | \`coordinate\` | Target element center from screenshot. |
| type        | Type text. | \`text\` | Use after clicking text field. |
| resize      | Resize viewport to w,h. | \`size\` | |
| scroll_down | Scroll down one page height. | None | |
| scroll_up   | Scroll up one page height. | None | |
| close       | Close browser. | None | MUST be final browser action. |

Usage:
<browser_action>
<action>Action to perform (e.g., launch, click, type, scroll_down, scroll_up, close)</action>
<url>URL to launch the browser at (optional)</url>
<coordinate>x,y coordinates (optional)</coordinate>
<text>Text to type (optional)</text>
</browser_action>

Example: Requesting to launch a browser at https://example.com
<browser_action>
<action>launch</action>
<url>https://example.com</url>
</browser_action>

Example: Requesting to click on the element at coordinates 450,300
<browser_action>
<action>click</action>
<coordinate>450,300</coordinate>
</browser_action>
`
}
