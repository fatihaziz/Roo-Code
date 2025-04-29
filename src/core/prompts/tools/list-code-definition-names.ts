import { ToolArgs } from "./types"

export function getListCodeDefinitionNamesDescription(args: ToolArgs): string {
	return `## list_code_definition_names
Description: List definition names (classes, functions, methods, etc.) from source code. Analyze a single file or all top-level files in a directory. Provides insights into codebase structure and constructs.
Parameters:
| Parameter | Type   | Required | Description |
|-----------|--------|----------|-------------|
| path      | string | Yes      | Path of file or directory (relative to ${args.cwd}). Directory lists definitions from all top-level source files. |
Usage:
<list_code_definition_names>
<path>Directory path here</path>
</list_code_definition_names>

Examples:

1. List definitions from a specific file:
<list_code_definition_names>
<path>src/main.ts</path>
</list_code_definition_names>

2. List definitions from all files in a directory:
<list_code_definition_names>
<path>src/</path>
</list_code_definition_names>
`
}
