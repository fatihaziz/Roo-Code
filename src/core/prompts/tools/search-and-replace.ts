import { ToolArgs } from "./types"

export function getSearchAndReplaceDescription(args: ToolArgs): string {
	return `## search_and_replace
Description: Find and replace text/patterns (regex) in a file. Targeted replacements across multiple locations. Supports literal/regex, case sensitivity, optional line ranges. Shows diff preview.

Required Parameters:
| Parameter | Type   | Required | Description |
|-----------|--------|----------|-------------|
| path      | string | Yes      | File path (relative to ${args.cwd.toPosix()}). |
| search    | string | Yes      | Text or pattern to search for. |
| replace   | string | Yes      | Text to replace matches with. |

Optional Parameters:
| Parameter   | Type    | Required | Description |
|-------------|---------|----------|-------------|
| start_line  | int     | No       | Starting line for restricted replacement (1-based). |
| end_line    | int     | No       | Ending line for restricted replacement (1-based). |
| use_regex   | boolean | No       | "true" to treat search as regex (default: false). |
| ignore_case | boolean | No       | "true" for case-insensitive matching (default: false). |

Notes:
- When use_regex is true, search is treated as regex.
- When ignore_case is true, search is case-insensitive.

Examples:

1. Simple text replacement:
<search_and_replace>
<path>example.ts</path>
<search>oldText</search>
<replace>newText</replace>
</search_and_replace>

2. Case-insensitive regex pattern:
<search_and_replace>
<path>example.ts</path>
<search>old\w+</search>
<replace>new$&</replace>
<use_regex>true</use_regex>
<ignore_case>true</ignore_case>
</search_and_replace>
`
}
