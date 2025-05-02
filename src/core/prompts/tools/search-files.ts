import { ToolArgs } from "./types"

export function getSearchFilesDescription(args: ToolArgs): string {
	return `## search_files
Description: Perform regex search across files in a directory, providing context-rich results. Searches recursively for patterns/content, displaying matches with context.

Parameters:
| Field | Required | Description |
| - | - | - |
| path | Yes | Directory path to search in (relative to ${args.cwd}). MUST be relative. |
| regex | Yes | Regex pattern (Rust syntax). MANDATORY: Craft precise regex. |
| file_pattern | Optional | Glob pattern to filter files (e.g., '*.ts'). Default: '*' (all files). |

Usage:
<search_files>
<path>Directory path here</path>
<regex>Your regex pattern here</regex>
<file_pattern>file pattern here (optional)</file_pattern>
</search_files>

Example: Search all .ts files in current directory
<search_files>
<path>.</path>
<regex>.*</regex>
<file_pattern>*.ts</file_pattern>
</search_files>`
}
