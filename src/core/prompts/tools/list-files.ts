import { ToolArgs } from "./types"

export function getListFilesDescription(args: ToolArgs): string {
	return `## list_files
Description: List files and directories in a specified directory. Recursive or top-level only. Do not use to confirm newly created files.
Parameters:
| Parameter | Type    | Required | Description |
|-----------|---------|----------|-------------|
| path      | string  | Yes      | Directory path (relative to ${args.cwd}). |
| recursive | boolean | Optional | true for recursive, false/omit for top-level. |
Usage:
<list_files>
<path>Directory path here</path>
<recursive>true or false (optional)</recursive>
</list_files>

Example: Requesting to list all files in the current directory
<list_files>
<path>.</path>
<recursive>false</recursive>
</list_files>
`
}
