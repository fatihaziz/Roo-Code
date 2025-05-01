import { ToolArgs } from "./types"

export function getReadFileDescription(args: ToolArgs): string {
	return `## read_file
Description: Read the contents of a file. Use to examine existing files (code, text, config). Output includes line numbers ("1 | const x = 1"). Specify start/end_line for large files. Extracts text from PDF/DOCX.
Parameters:
| Parameter  | Type   | Required | Description |
|------------|--------|----------|-------------|
| path       | string | Yes      | File path (relative to ${args.cwd}). |
| start_line | int    | Optional | Starting line (1-based). Reads from start if omitted. |
| end_line   | int    | Optional | Ending line (1-based, inclusive). Reads to end if omitted. |
Usage:
<read_file>
<args>
  <file>
    <path>path/to/file</path>
    <line_range>1-100</line_range>
    <line_range>200-300</line_range>
  </file>
</args>
</read_file>

Examples:

1. Reading a single file with one line range:
<read_file>
<args>
  <file>
    <path>src/app.ts</path>
    <line_range>1-1000</line_range>
  </file>
</args>
</read_file>

2. Reading multiple files with different line ranges:
<read_file>
<args>
  <file>
    <path>src/app.ts</path>
    <line_range>1-50</line_range>
    <line_range>100-150</line_range>
  </file>
  <file>
    <path>src/utils.ts</path>
    <line_range>10-20</line_range>
  </file>
</args>
</read_file>

3. Reading an entire file (omitting line ranges):
<read_file>
<args>
  <file>
    <path>config.json</path>
  </file>
</args>
</read_file>

4. Reading a specific function in a source file:
<read_file>
<path>src/app.ts</path>
<start_line>46</start_line>
<end_line>68</end_line>
</read_file>

Note: start_line/end_line efficiently stream requested lines for large files.
`
}
