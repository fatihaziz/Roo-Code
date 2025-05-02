import { ToolArgs } from "./types"

export function getSearchAndReplaceDescription(args: ToolArgs): string {
	return `## search_and_replace
Description: Find and replace text/patterns (regex) in a file. Targeted replacements across multiple locations. Supports literal/regex, case sensitivity, optional line ranges. Shows diff preview.

**Required Parameters:**
| Field | Type | Description |
| - | - | - |
| path | string | File path (relative to workspace ${args.cwd.toPosix()}). MUST be relative. |
| search | string | Text or pattern to search for. |
| replace | string | Text to replace matches with. |

**Optional Parameters:**
| Field | Type | Description | Default |
| - | - | - | - |
| start_line | int | Starting line for restricted replacement (1-based). | N/A |
| end_line | int | Ending line for restricted replacement (1-based). | N/A |
| use_regex | boolean | "true" to treat search as regex. | false |
| ignore_case | boolean | "true" for case-insensitive matching. | false |

**Notes:**
- \`use_regex=true\`: \`search\` is treated as regex.
- \`ignore_case=true\`: Search is case-insensitive (literal or regex).

Examples:
1. Simple text: \`<search_and_replace><path>f.ts</path><search>old</search><replace>new</replace></search_and_replace>\`
2. Regex (case-insensitive): \`<search_and_replace><path>f.ts</path><search>old\\w+</search><replace>new$&</replace><use_regex>true</use_regex><ignore_case>true</ignore_case></search_and_replace>\`
`
}
