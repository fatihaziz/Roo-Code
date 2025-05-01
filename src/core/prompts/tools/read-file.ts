import { ToolArgs } from "./types"

export function getReadFileDescription(args: ToolArgs): string {
  return `## TOOL: read_file

| Field       | Type     | Required | Description                                                             |
|-------------|----------|----------|-------------------------------------------------------------------------|
| path        | string   | yes        | File path, relative to workspace (${args.cwd})                          |
| line_range  | string[] | optional        | One or more "start-end" line ranges (inclusive, 1-based). Optional.     |

Line-numbered output (e.g., "1 | const x = 1"). Use line ranges to read selectively. Supports PDF/DOCX text extraction. May break with other binary types.

### Usage Format:
<read_file>
  <args>
    <file>
      <path>...</path>
      <line_range>start-end</line_range>   <!-- Optional, repeatable -->
    </file>
    ...
  </args>
</read_file>

### Examples:
1. **Single file, one range**
<read_file>
  <args>
    <file>
      <path>src/app.ts</path>
      <line_range>1-1000</line_range>
    </file>
  </args>
</read_file>

2. **Multi-file, varied ranges**
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

3. **Full file (omit range)**
<read_file>
  <args>
    <file>
      <path>config.json</path>
    </file>
  </args>
</read_file>

### Reading Strategy Rules
| Rule # | Enforcement                                                                               |
|--------|--------------------------------------------------------------------------------------------|
| 1      | Read all relevant files/impls together in a **single operation**                          |
| 2      | Gather all required context **before** any change                                         |
| 3      | Merge adjacent line ranges if gap ≤ 10                                                    |
| 4      | Use separate line_range if content separated by >10 lines                                |
| 5      | Minimize ranges while ensuring enough context for edits                                   |
`
}
