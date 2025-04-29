import { ToolArgs } from "./types"

export function getInsertContentDescription(args: ToolArgs): string {
	return `## insert_content
Description: Add new lines to a file without modifying existing content. Specify line number (1-based), 0 to append. Ideal for imports, functions, blocks, log entries.

Parameters:
| Parameter | Type   | Required | Description |
|-----------|--------|----------|-------------|
| path      | string | Yes      | File path relative to workspace directory ${args.cwd.toPosix()} |
| line      | int    | Yes      | Line number to insert before (1-based), 0 to append at end. |
| content   | string | Yes      | Content to insert. |

Example for inserting imports at start of file:
<insert_content>
<path>src/utils.ts</path>
<line>1</line>
<content>
// Add imports at start of file
import { sum } from './math';
</content>
</insert_content>

Example for appending to the end of file:
<insert_content>
<path>src/utils.ts</path>
<line>0</line>
<content>
// This is the end of the file
</content>
</insert_content>
`
}
