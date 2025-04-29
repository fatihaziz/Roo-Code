# build_then_test.ps1
# Script to build the Roo Code VSCode extension and test it in an isolated instance.

function Invoke-BuildThenTestExtension {
    # Stop script on first error within the function
    $ErrorActionPreference = "Stop"

    Write-Host "Starting Roo Code extension build and test process..."

    # 1. Install all dependencies
    Write-Host "Step 1: Installing dependencies..."
    pnpm run install:all
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Dependency installation failed!"
        exit 1
    }
    Write-Host "Dependencies installed successfully."

    # 2. Build and package the extension
    Write-Host "Step 2: Building and packaging the extension..."
    pnpm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Build process failed!"
        exit 1
    }
    Write-Host "Extension built and packaged successfully."

    # 3. Find the .vsix file
    Write-Host "Step 3: Finding the .vsix file..."
    $vsixFile = Get-ChildItem -Path "bin" -Filter "roo-cline-*.vsix" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $vsixFile) {
        Write-Error "Could not find the .vsix file in the 'bin' directory!"
        exit 1
    }
    $vsixPath = $vsixFile.FullName
    Write-Host "Found VSIX file: $vsixPath"

    # 4. Define isolated user data directory
    Write-Host "Step 4: Defining isolated user data directory..."
    $isolatedUserDataDir = Join-Path (Get-Location) ".vscode-test"
    Write-Host "Isolated user data directory: $isolatedUserDataDir"

    # 5. Install the extension in the isolated VS Code instance
    Write-Host "Step 5: Installing the extension via 'code' command in isolated environment..."
    # Use --force to ensure it overwrites if already installed in the isolated environment
    code --install-extension $vsixPath --user-data-dir $isolatedUserDataDir --force
    if ($LASTEXITCODE -ne 0) {
        # Note: VS Code CLI might return non-zero exit codes even on success in some scenarios (like already installed).
        # We'll treat it as a warning rather than a hard failure unless VS Code explicitly signals an error.
        Write-Warning "VS Code CLI exited with code $LASTEXITCODE during isolated installation. Check VS Code for installation status. Use '--force' to overwrite if needed."
    } else {
        Write-Host "Extension installation command executed successfully for isolated environment."
    }

    # 6. Launch VS Code for development with the isolated user data directory
    Write-Host "Step 6: Launching isolated VS Code instance for development..."
    # This command launches a new VS Code window. The script will continue after this.
    code --extensionDevelopmentPath (Get-Location) --user-data-dir $isolatedUserDataDir

    Write-Host "Isolated VS Code instance launched. Test your extension there."
    Write-Host "Build and test script finished."
}

# Execute the build and test process
Invoke-BuildThenTestExtension