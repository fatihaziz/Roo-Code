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
<path>File path here</path>
<start_line>Starting line number (optional)</start_line>
<end_line>Ending line number (optional)</end_line>
</read_file>

Examples:

1. Reading an entire file:
<read_file>
<path>frontend-config.json</path>
</read_file>

2. Reading the first 1000 lines of a large log file:
<read_file>
<path>logs/application.log</path>
<end_line>1000</end_line>
</read_file>

3. Reading lines 500-1000 of a CSV file:
<read_file>
<path>data/large-dataset.csv</path>
<start_line>500</start_line>
<end_line>1000</end_line>
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
