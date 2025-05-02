import { ToolArgs } from "./types"

export function getInsertContentDescription(args: ToolArgs): string {
	return `## insert_content
Description: Add new lines to a file without modifying existing content. Specify line number (1-based), 0 to append. Ideal for imports, functions, blocks, log entries.

Parameters:
| Field | Required | Description |
| - | - | - |
| path | Yes | File path relative to workspace ${args.cwd.toPosix()} |
| line | Yes | Line number to insert before (1-based), 0 to append at end. |
| content | Yes | Content to insert. |

Example: Insert imports at start
<insert_content>
<path>src/utils.ts</path>
<line>1</line>
<content>
// Add imports at start of file
import { sum } from './math';
</content>
</insert_content>

Example: Append to end
<insert_content>
<path>src/utils.ts</path>
<line>0</line>
<content>
// This is the end of the file
</content>
</insert_content>
`
}
