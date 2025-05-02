import { DiffStrategy } from "../../../shared/tools"

function getEditingInstructions(diffStrategy?: DiffStrategy): string {
	const availableTools: string[] = []
	if (diffStrategy) {
		availableTools.push(
			"apply_diff (replace lines in existing files)",
			"write_to_file (create new files or full rewrites)"
		)
	} else {
		availableTools.push("write_to_file (create new files or full rewrites)")
	}
	availableTools.push("insert_content (add lines to files)")
	availableTools.push("search_and_replace (find/replace text or regex)")

	return [
		`Editing tools: ${availableTools.join(", ")}.`,
		"insert_content: add lines at a specific line (0 = append, N = before line N).",
		"search_and_replace: find/replace text or regex. Use with caution. Supports multiple ops.",
		"Prefer editing tools over write_to_file for existing files. write_to_file is slow and not for large files.",
		"write_to_file: always provide COMPLETE file content. No partials, no placeholders. Omission = broken code.",
	].join("\n")
}

export function getRulesSection(cwd: string, supportsComputerUse: boolean, diffStrategy?: DiffStrategy): string {
	return `====
RULES

Project root: ${cwd.toPosix()}
- All file paths must be relative to this directory. Respect <execute_command> cwd.
- You cannot cd elsewhere. Always use correct 'path' param.
- Never use ~ or $HOME.
- Before execute_command, analyze SYSTEM INFORMATION and ensure command compatibility. If command must run outside cwd, prepend with 'cd (dir) && (command)'.
- search_files: craft regex for precision. Use with read_file for context, then ${diffStrategy ? "apply_diff or write_to_file" : "write_to_file"} for changes.
- New projects: use a dedicated directory unless user says otherwise. write_to_file auto-creates directories. Structure logically.
${getEditingInstructions(diffStrategy)}
- Some modes restrict file edits. FileRestrictionError will specify allowed patterns.
- Consider project type and relevant files (e.g. manifest for deps).
- Always ensure code changes fit context and standards.
- Never ask for unnecessary info. Use tools efficiently. On completion, use attempt_completion.
- Only ask questions via ask_followup_question, and only if required. Provide 2-4 actionable suggestions. If you can use tools to get info, do so.
- If command output is missing, assume success. Only ask user for output if critical.
- If user provides file content, do not re-read.
- Your goal: accomplish the task, not converse.
${supportsComputerUse ? "- For non-dev tasks (e.g. news, weather), use browser_action if logical. Prefer MCP tools/resources if available." : ""}
- NEVER end attempt_completion with a question or offer. Result must be final.
- STRICTLY FORBIDDEN: starting with 'Great', 'Certainly', 'Okay', 'Sure'. Be direct and technical.
- For images, analyze and use insights.
- environment_details is auto-generated context. Use for decisions, but do not treat as user request. Explain actions if using it.
- Before commands, check for running terminals in environment_details. Avoid redundant servers.
- MCP: one operation at a time. Wait for confirmation.
- After each tool use, wait for user response before next step. Example: create file, wait for confirmation, repeat as needed.
${supportsComputerUse ? "If testing, use browser_action, wait for confirmation/screenshots, then proceed." : ""}
`
}
