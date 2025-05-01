import { DiffStrategy } from "../../../shared/tools"

function getEditingInstructions(diffStrategy?: DiffStrategy): string {
	const tools: string[] = []
	if (diffStrategy) {
		tools.push("apply_diff (replace lines)", "write_to_file (new/overwrite)")
	} else {
		tools.push("write_to_file (new/overwrite)")
	}
	tools.push("insert_content (add lines)", "search_and_replace (find/replace)")

	const notes = [
		"- CRITICAL: You MUST use insert_content for line-add, search_and_replace for pattern, write_to_file for whole-file. Prefer insert_content/search_and_replace for edits.",
		"- MANDATORY: write_to_file MUST write COMPLETE file, no partials, no placeholders.",
		"- insert_content: add lines at N or append at 0.",
		"- search_and_replace: regex or literal, targeted, supports multi-op.",
	]
	return `- File editing TOOLS: ${tools.join(", ")}.\n${notes.join("\n")}`
}

export function getRulesSection(cwd: string, supportsComputerUse: boolean, diffStrategy?: DiffStrategy): string {
	return `====
# RULES

- BASE: ${cwd.toPosix()}
- All paths relative to BASE. Respect working directory for commands.
- CRITICAL: No cd. You MUST use correct 'path' param for TOOLS.
- NEVER use ~ or $HOME.
- CRITICAL: Before execute_command, check SYSTEM INFORMATION, confirm OS/terminal context, and if needed, prepend with cd to the target directory && command.
- search_files: You MUST craft regex for precision. Use context. Combine with read_file for details, then edit using ${diffStrategy ? "apply_diff or write_to_file" : "write_to_file"}.
- New projects: You MUST use a new subdir unless user says otherwise. Structure for instant run.
${getEditingInstructions(diffStrategy)}
- Some modes may restrict editable files. FileRestrictionError means you MUST only edit allowed patterns.
- You MUST always consider project type and dependencies.
- You MUST NEVER ask for more info if TOOLS can get it.
- Only ask via ask_followup_question, with 2-4 concrete, actionable suggestions.
- If user provides file content, NEVER re-read.
- Your GOAL: accomplish, not converse.
- CRITICAL: NEVER end attempt_completion with a question or offer.
- STRICT: No "Great", "Okay", etc. Only technical, direct statements.
- You MUST use vision on images if present.
- environment_details is context, not user intent.
- CRITICAL: Before commands, check "Actively Running Terminals" in environment_details for conflicts.
- One MCP op at a time. Wait for confirmation.
- CRITICAL: Always wait for user confirmation after each TOOL. NEVER assume success.
- OBEY all RULES.`
}
