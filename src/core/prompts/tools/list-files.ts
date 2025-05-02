import { ToolArgs } from "./types"

export function getListFilesDescription(args: ToolArgs): string {
	return `## list_files
Description: List files and directories in a specified directory. Recursive or top-level only.

**CRITICAL**: You MUST NOT use this tool to confirm file creation. User response confirms success/failure.

Parameters:
| Field     | Required | Description                                                                 |
|-----------|----------|-----------------------------------------------------------------------------|
| path      | Yes      | Directory path (relative to workspace ${args.cwd}).                         |
| recursive | Optional | true for recursive, false/omit for top-level.                               |

Usage:
<list_files>
<path>Directory path here</path>
<recursive>true or false (optional)</recursive>
</list_files>

Example: List top-level files in current directory
<list_files>
<path>.</path>
<recursive>false</recursive>
</list_files>`
}
