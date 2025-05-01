// build-then-test.js
// Cross-platform Node.js script to build, package, and test Roo Code VSCode extension in isolated instance.

const { execSync, spawnSync } = require("child_process")
const fs = require("fs")
const path = require("path")
const os = require("os")

// Helper to run commands and throw on failure
function run(command, opts = {}) {
	console.log(`[cmd] ${command}`)
	try {
		execSync(command, { stdio: "inherit", ...opts })
	} catch (e) {
		throw new Error(`Command failed: ${command}`)
	}
}

// 1. Install all dependencies
console.log("Step 1: Installing dependencies...")
run("pnpm run install:all")
console.log("Dependencies installed successfully.")

// 2. Build and package the extension
console.log("Step 2: Building and packaging the extension...")
run("pnpm run build")
console.log("Extension built and packaged successfully.")

// 3. Find the .vsix file
console.log("Step 3: Finding the .vsix file...")
const binDir = path.join(__dirname, "..", "bin")
if (!fs.existsSync(binDir)) {
	throw new Error("Could not find 'bin' directory!")
}
const vsixFiles = fs
	.readdirSync(binDir)
	.filter((f) => /^roo-cline-.*\.vsix$/.test(f))
	.map((f) => ({
		file: f,
		mtime: fs.statSync(path.join(binDir, f)).mtime,
	}))
	.sort((a, b) => b.mtime - a.mtime)

if (vsixFiles.length === 0) {
	throw new Error("Could not find any roo-cline-*.vsix in the 'bin' directory!")
}
const vsixPath = path.resolve(binDir, vsixFiles[0].file)
console.log(`Found VSIX file: ${vsixPath}`)

// 4. Define isolated user data directory
console.log("Step 4: Defining isolated user data directory...")
const cwd = process.cwd()
const isolatedUserDataDir = path.join(cwd, ".vscode-test")
console.log(`Isolated user data directory: ${isolatedUserDataDir}`)

// 5. Install the extension in the isolated VS Code instance
console.log("Step 5: Installing the extension via 'code' command in isolated environment...")
const codeCmd = process.platform === "win32" ? "code.cmd" : "code"
const installArgs = ["--install-extension", vsixPath, "--user-data-dir", isolatedUserDataDir, "--force"]
const installResult = spawnSync(codeCmd, installArgs, { stdio: "inherit" })
if (installResult.status !== 0) {
	console.warn(
		`VS Code CLI exited with code ${installResult.status} during isolated installation. Check VS Code for installation status. Use '--force' to overwrite if needed.`,
	)
} else {
	console.log("Extension installation command executed successfully for isolated environment.")
}

// 6. Launch VS Code for development with the isolated user data directory
console.log("Step 6: Launching isolated VS Code instance for development...")
const devArgs = ["--extensionDevelopmentPath", cwd, "--user-data-dir", isolatedUserDataDir]
spawnSync(codeCmd, devArgs, { stdio: "inherit" })

console.log("Isolated VS Code instance launched. Test your extension there.")
console.log("Build and test script finished.")
