<#
.SYNOPSIS
Validates the DailyNagger development machine setup.

.DESCRIPTION
Checks that required tools are available, important environment variables point
at E:, Android SDK command-line tools resolve, and project-level restore/check
commands can run. This script does not install or change tools.

.PARAMETER RepoRootPath
Repository root to validate. Defaults to the parent folder of this script.

.PARAMETER SkipProjectChecks
Skips dotnet restore, npm install, mobile typecheck, and expo-doctor.

.EXAMPLE
.\scripts\validate-dev-machine.ps1

Validates tools, paths, and project checks for the current checkout.
#>

param(
    [string]$RepoRootPath,
    [switch]$SkipProjectChecks
)

$ErrorActionPreference = "Stop"

function Assert-CommandAvailable {
    param([string]$CommandName)

    if (Get-Command $CommandName -ErrorAction SilentlyContinue) {
        Write-Host "[ok] $CommandName"
        return
    }

    throw "Missing required command in this shell: $CommandName. Open a new terminal after installing tools or rerun scripts\configure-dev-machine.ps1."
}

function Assert-PathExists {
    param([string]$Path)

    if (Test-Path $Path) {
        Write-Host "[ok] $Path"
        return
    }

    throw "Missing expected path: $Path"
}

function Assert-EnvPath {
    param(
        [string]$Name,
        [string]$ExpectedValue
    )

    $actualValue = [Environment]::GetEnvironmentVariable($Name, "User")

    if ($actualValue -eq $ExpectedValue) {
        Write-Host "[ok] $Name=$ExpectedValue"
        return
    }

    throw "Expected user env $Name to be '$ExpectedValue', but found '$actualValue'."
}

function Assert-LastExitCode {
    param([string]$CommandName)

    if ($LASTEXITCODE -ne 0) {
        throw "$CommandName failed with exit code $LASTEXITCODE."
    }
}

function Assert-WindowsLongPathsEnabled {
    $longPathsValue = Get-ItemPropertyValue `
        -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" `
        -Name "LongPathsEnabled" `
        -ErrorAction SilentlyContinue

    if ($longPathsValue -eq 1) {
        Write-Host "[ok] Windows long paths enabled"
        return
    }

    throw "Windows long paths are disabled. Run scripts\configure-dev-machine.ps1 as Administrator."
}

function Assert-GitLongPathsEnabled {
    $gitLongPaths = (& git config --global --get core.longpaths)

    if ($gitLongPaths -eq "true") {
        Write-Host "[ok] git core.longpaths=true"
        return
    }

    throw "Expected git core.longpaths=true, but found '$gitLongPaths'."
}

$repoRoot = if ([string]::IsNullOrWhiteSpace($RepoRootPath)) {
    (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}
else {
    (Resolve-Path $RepoRootPath).Path
}

$mobileProject = Join-Path $repoRoot "src\DailyNagger.Mobile"
$androidSdkPath = "E:\Android\Sdk"
$ninjaPath = "E:\Programs\ninja\ninja.exe"

Write-Host "Validating DailyNagger development machine..."
Write-Host "Repo root: $repoRoot"

Assert-PathExists "E:\DailyNagger"
Assert-PathExists "E:\Programs"
Assert-PathExists "E:\Programs\ninja"
Assert-PathExists "E:\Secrets"
Assert-PathExists "E:\Caches"
Assert-PathExists "E:\Caches\npm"
Assert-PathExists "E:\Caches\nuget"
Assert-PathExists "E:\Caches\gradle"
Assert-PathExists "E:\Android\Sdk"
Assert-PathExists "E:\Android\Avd"

Assert-EnvPath "NUGET_PACKAGES" "E:\Caches\nuget"
Assert-EnvPath "GRADLE_USER_HOME" "E:\Caches\gradle"
Assert-EnvPath "ANDROID_HOME" $androidSdkPath
Assert-EnvPath "ANDROID_SDK_ROOT" $androidSdkPath
Assert-EnvPath "ANDROID_AVD_HOME" "E:\Android\Avd"
Assert-EnvPath "DAILY_NAGGER_NINJA" $ninjaPath

Assert-CommandAvailable "git"
Assert-CommandAvailable "node"
Assert-CommandAvailable "npm"
Assert-CommandAvailable "dotnet"
Assert-CommandAvailable "java"
Assert-CommandAvailable "javac"
Assert-CommandAvailable "adb"
Assert-CommandAvailable "sdkmanager"
Assert-CommandAvailable "ninja"

Assert-WindowsLongPathsEnabled
Assert-GitLongPathsEnabled

Assert-PathExists "E:\Android\Sdk\platform-tools\adb.exe"
Assert-PathExists "E:\Android\Sdk\cmdline-tools\latest\bin\sdkmanager.bat"
Assert-PathExists $ninjaPath

$npmCache = (& npm config get cache).Trim()
if ($npmCache -ne "E:\Caches\npm") {
    throw "Expected npm cache to be E:\Caches\npm, but found '$npmCache'."
}

Write-Host "[ok] npm cache=$npmCache"

$ninjaVersion = (& $ninjaPath --version).Trim()
if ([version]$ninjaVersion -lt [version]"1.12.0") {
    throw "Expected Ninja 1.12.0 or newer, but found $ninjaVersion."
}

Write-Host "[ok] ninja $ninjaVersion"

if ($SkipProjectChecks) {
    Write-Host "Skipping project checks."
    Write-Host "DailyNagger machine validation completed."
    return
}

Write-Host "Restoring .NET packages..."
& dotnet restore (Join-Path $repoRoot "DailyNagger.sln")
Assert-LastExitCode "dotnet restore"

Write-Host "Installing mobile npm packages..."
& npm install --prefix $mobileProject
Assert-LastExitCode "npm install mobile"

Write-Host "Running mobile typecheck..."
& npm run typecheck --prefix $mobileProject
Assert-LastExitCode "mobile typecheck"

Write-Host "Running Expo Doctor..."
Push-Location $mobileProject
try {
    & npx expo-doctor
    if ($LASTEXITCODE -ne 0) {
        Write-Host "expo-doctor reported issues. Review whether they are known project warnings."
    }
}
finally {
    Pop-Location
}

Write-Host "DailyNagger machine validation completed."
