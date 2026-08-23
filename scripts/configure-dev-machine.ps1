<#
.SYNOPSIS
Configures DailyNagger machine-level development paths.

.DESCRIPTION
Creates the expected E: drive folders, points heavy development caches at E:,
and adds Android SDK tools to the current user's PATH without using setx for
PATH. This script does not install Git, Node.js, .NET, Java, Android Studio,
Docker, or Visual Studio.

.EXAMPLE
.\scripts\configure-dev-machine.ps1

Creates folders and writes user environment variables for a DailyNagger
development machine.
#>

param(
    [string]$DevelopmentDrive = "E:"
)

$ErrorActionPreference = "Stop"

function Join-DevPath {
    param([string]$ChildPath)

    return Join-Path $DevelopmentDrive $ChildPath
}

function Set-UserEnvironmentVariable {
    param(
        [string]$Name,
        [string]$Value
    )

    [Environment]::SetEnvironmentVariable($Name, $Value, "User")
    Set-Item -Path "Env:$Name" -Value $Value
    Write-Host "$Name=$Value"
}

function Add-UserPathEntry {
    param([string]$PathEntry)

    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    $parts = @($userPath -split ";" | Where-Object { $_ })

    if ($parts -contains $PathEntry) {
        return
    }

    $parts += $PathEntry
    [Environment]::SetEnvironmentVariable("Path", ($parts -join ";"), "User")
    $env:Path = "$env:Path;$PathEntry"
    Write-Host "Added PATH entry: $PathEntry"
}

$folders = @(
    "DailyNagger",
    "Programs",
    "Secrets",
    "Caches",
    "Caches\npm",
    "Caches\nuget",
    "Caches\gradle",
    "Docker",
    "Data",
    "Rescue",
    "Android\Sdk",
    "Android\Avd"
)

foreach ($folder in $folders) {
    New-Item -ItemType Directory -Force (Join-DevPath $folder) | Out-Null
}

$androidSdkPath = Join-DevPath "Android\Sdk"

Set-UserEnvironmentVariable "NUGET_PACKAGES" (Join-DevPath "Caches\nuget")
Set-UserEnvironmentVariable "GRADLE_USER_HOME" (Join-DevPath "Caches\gradle")
Set-UserEnvironmentVariable "ANDROID_HOME" $androidSdkPath
Set-UserEnvironmentVariable "ANDROID_SDK_ROOT" $androidSdkPath
Set-UserEnvironmentVariable "ANDROID_AVD_HOME" (Join-DevPath "Android\Avd")

if (Get-Command npm -ErrorAction SilentlyContinue) {
    & npm config set cache (Join-DevPath "Caches\npm") --global
    if ($LASTEXITCODE -ne 0) {
        throw "npm cache configuration failed with exit code $LASTEXITCODE."
    }

    Write-Host "npm cache=$(npm config get cache)"
}
else {
    Write-Host "npm was not found. Install Node.js, then rerun this script to set npm cache."
}

Add-UserPathEntry (Join-Path $androidSdkPath "platform-tools")
Add-UserPathEntry (Join-Path $androidSdkPath "cmdline-tools\latest\bin")

Write-Host "DailyNagger machine paths configured. Open a new terminal before validating tools."
