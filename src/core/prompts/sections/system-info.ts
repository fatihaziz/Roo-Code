import os from "os"
import osName from "os-name"
import { getShell } from "../../../utils/shell"

export function getSystemInfoSection(cwd: string): string {
	return `====
SYSTEM INFORMATION

- OS: ${osName()}
- Shell: ${getShell()}
- Home: ${os.homedir().toPosix()}
- Workspace: ${cwd.toPosix()}

- Workspace is the VSCode project root. All tool operations default here. Terminals start here unless cd'd; cd in terminal does not change workspace.
- On task start, you get a recursive file list for context. Use list_files to explore further if needed.
`
}
