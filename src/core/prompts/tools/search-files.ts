import { ToolArgs } from "./types"

export function getSearchFilesDescription(args: ToolArgs): string {
	return `## search_files
Description: Perform regex search across files in a directory, providing context-rich results. Searches for patterns/content across multiple files, displaying matches with context.
Parameters:
| Parameter    | Type   | Required | Description |
|--------------|--------|----------|-------------|
| path         | string | Yes      | Directory path to search in (relative to ${args.cwd}). Recursively searched. |
| regex        | string | Yes      | Regex pattern (Rust syntax). |
| file_pattern | string | Optional | Glob pattern to filter files (e.g., '*.ts'). Searches all files (*) if omitted. |
Usage:
<search_files>
<path>Directory path here</path>
<regex>Your regex pattern here</regex>
<file_pattern>file pattern here (optional)</file_pattern>
</search_files>

Example: Requesting to search for all .ts files in the current directory
<search_files>
<path>.</path>
<regex>.*</regex>
<file_pattern>*.ts</file_pattern>
</search_files>
`
}
