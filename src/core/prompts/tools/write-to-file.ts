import { ToolArgs } from "./types"

export function getWriteToFileDescription(args: ToolArgs): string {
	return `## write_to_file
| Parameter   | Type    | Required | Description                                                 |
|-------------|---------|----------|-------------------------------------------------------------|
| path        | string  | Yes      | File path (relative to workspace: ${args.cwd})              |
| content     | string  | Yes      | COMPLETE file content. No truncation. NO line numbers.      |
| line_count  | int     | Yes      | Total lines, including empty ones.                          |

**CRITICAL**: Use TOOL for EVERY response.
**CRITICAL**: NEVER stop or call \`attempt_completion\` until explicitly instructed.
**IMPORTANT**: No partial/omitted content.
**IMPORTANT**: No file display in prompt, only TOOL invocation.

**Usage:**
<write_to_file>
  <path>File path here</path>
  <content>
    ...file content...
  </content>
  <line_count>total number of lines</line_count>
</write_to_file>
`
}
