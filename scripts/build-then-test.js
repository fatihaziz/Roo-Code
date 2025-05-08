// build-then-test.js
// Cross-platform Node.js script to build, package, and test Roo Code VSCode extension.

const { execSync, spawnSync, spawn } = require("child_process")
const fs = require("fs")
const path = require("path")

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

// 4. Install the extension in the current VS Code instance
console.log("Step 4: Installing the extension via 'code' command...")
const codeCmd = process.platform === "win32" ? "code.cmd" : "code"
const installArgs = ["--install-extension", vsixPath, "--force"]
const installResult = spawnSync(codeCmd, installArgs, { stdio: "inherit" })
if (installResult.status !== 0) {
	console.warn(
		`VS Code CLI exited with code ${installResult.status} during installation. Check VS Code for installation status. Use '--force' to overwrite if needed.`,
	)
} else {
	console.log("Extension installation command executed successfully.")
}

// 5. Launch VS Code for development
console.log("Step 5: Launching VS Code instance for development...")
const cwd = process.cwd()
const devArgs = ["--extensionDevelopmentPath", cwd]
spawn(codeCmd, devArgs, { shell: true })

console.log("VS Code instance launched. Test your extension there.")
console.log("Build and test script finished.")
