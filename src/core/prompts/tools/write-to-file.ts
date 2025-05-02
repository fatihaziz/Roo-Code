import { ToolArgs } from './types'

export function getWriteToFileDescription (args: ToolArgs): string {
	return `## write_to_file
Description: Write full content to a file. Overwrites if exists, creates if not. Automatically creates needed directories.

**CRITICAL RULES:**
1.  COMPLETE Content: You MUST provide the ENTIRE intended file content. No truncation, omissions, or placeholders. Include ALL parts, even unmodified sections.
2.  NO Line Numbers: The \`content\` parameter MUST contain only the raw file content, without line numbers.
3.  Accurate Line Count: The \`line_count\` MUST reflect the total lines in the provided \`content\`, including empty lines.

Parameters:
| Parameter   | Type   | Required | Description                                                 |
|----|----|----|----|
| path        | string | Yes      | File path (relative to workspace ${args.cwd}). MUST be relative. |
| content     | string | Yes      | COMPLETE file content. No truncation. NO line numbers.      |
| line_count  | int    | Yes      | Total lines, including empty ones.                          |

Usage:
<write_to_file>
<path>File path here</path>
<content>
{
  "apiEndpoint": "https://api.example.com",
  "theme": {
    "primaryColor": "#007bff",
    "secondaryColor": "#6c757d"
  },
  "version": "1.0.0"
}
</write_to_file>
`
}
