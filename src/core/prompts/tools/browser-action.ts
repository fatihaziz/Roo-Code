import { ToolArgs } from "./types"

export function getBrowserActionDescription(args: ToolArgs): string | undefined {
	if (!args.supportsComputerUse) return undefined

	return `## browser_action
Description: Interact with a Puppeteer browser. Each action (except \`close\`) returns screenshot + console logs. One action per message. Wait for response before next action.
- Mandatory Sequence: Start with \`launch\`, end with \`close\`. For new URLs unreachable via navigation, \`close\` then \`launch\` again.
- Browser Active: Only \`browser_action\` tool allowed. Close browser before using other tools (e.g., file edits).
- Resolution: ${args.browserViewportSize}. Click coordinates must be within this range.
- Clicks: Target element CENTER based on screenshot coordinates.
Parameters:
- action: (required) One of:
    * launch: Start browser at URL. MUST be first action. Requires \`url\`. Example: <url>http://localhost:3000</url>
    * hover: Move cursor to x,y. Requires \`coordinate\`. Target element center.
    * click: Click at x,y. Requires \`coordinate\`. Target element center.
    * type: Type text. Requires \`text\`. Use after clicking a field. Example: <text>Input text</text>
    * resize: Resize viewport to w,h. Requires \`size\`. Example: <size>1280,720</size>
    * scroll_down: Scroll down one page height.
    * scroll_up: Scroll up one page height.
    * close: Close browser. MUST be final action. Example: <action>close</action>
- url: (optional) URL for \`launch\`. Must be valid (e.g., http://, file:///).
- coordinate: (optional) x,y for \`click\`, \`hover\`. Within ${args.browserViewportSize}. Example: <coordinate>450,300</coordinate>
- size: (optional) w,h for \`resize\`.
- text: (optional) String for \`type\`.
Usage:
<browser_action>
<action>action_name</action>
<url>url_here (if launch)</url>
<coordinate>x,y (if click/hover)</coordinate>
<text>text_here (if type)</text>
<size>w,h (if resize)</size>
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
