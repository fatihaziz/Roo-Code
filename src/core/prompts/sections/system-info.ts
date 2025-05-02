import os from "os"
import osName from "os-name"
import { getShell } from "../../../utils/shell"

export function getSystemInfoSection(cwd: string): string {
	return `====
SYSTEM INFORMATION

> Operating System: ${osName()}
> Default Shell: ${getShell()}
> Home Directory: ${os.homedir().toPosix()}
> Current Workspace Directory: ${cwd.toPosix()}

Workspace is the VS Code project root. All tool ops default here. New terminals start here. Changing terminal dir does not change workspace. On task start, you get a recursive file list for context. Use list_files for further exploration (recursive for deep, non-recursive for shallow).
`
}
