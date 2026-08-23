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
$NinjaVersion = "1.12.1"
$NinjaDownloadUrl = "https://github.com/ninja-build/ninja/releases/download/v$NinjaVersion/ninja-win.zip"

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

function Test-IsAdministrator {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = [Security.Principal.WindowsPrincipal] $identity

    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Enable-WindowsLongPaths {
    $longPathsRegistryPath = "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem"
    $longPathsValue = Get-ItemPropertyValue `
        -Path $longPathsRegistryPath `
        -Name "LongPathsEnabled" `
        -ErrorAction SilentlyContinue

    if ($longPathsValue -eq 1) {
        Write-Host "Windows long paths already enabled."
        return
    }

    if (-not (Test-IsAdministrator)) {
        throw "Windows long paths are disabled. Rerun this script as Administrator so Android/CMake builds can use paths longer than 260 characters."
    }

    New-ItemProperty `
        -Path $longPathsRegistryPath `
        -Name "LongPathsEnabled" `
        -Value 1 `
        -PropertyType DWORD `
        -Force | Out-Null

    Write-Host "Windows long paths enabled."
}

function Install-Ninja {
    param([string]$InstallPath)

    $ninjaPath = Join-Path $InstallPath "ninja.exe"

    if (Test-Path $ninjaPath) {
        $installedVersion = (& $ninjaPath --version).Trim()

        if ([version]$installedVersion -ge [version]"1.12.0") {
            Write-Host "ninja $installedVersion already installed at $ninjaPath"
            return $ninjaPath
        }
    }

    New-Item -ItemType Directory -Force $InstallPath | Out-Null

    $zipPath = Join-Path $InstallPath "ninja-win.zip"
    Invoke-WebRequest $NinjaDownloadUrl -OutFile $zipPath
    Expand-Archive $zipPath -DestinationPath $InstallPath -Force
    Remove-Item $zipPath

    $installedVersion = (& $ninjaPath --version).Trim()
    if ([version]$installedVersion -lt [version]"1.12.0") {
        throw "Expected Ninja 1.12.0 or newer, but installed $installedVersion."
    }

    Write-Host "Installed ninja $installedVersion at $ninjaPath"
    return $ninjaPath
}

$folders = @(
    "DailyNagger",
    "Programs",
    "Programs\ninja",
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
$ninjaPath = Install-Ninja (Join-DevPath "Programs\ninja")

Set-UserEnvironmentVariable "NUGET_PACKAGES" (Join-DevPath "Caches\nuget")
Set-UserEnvironmentVariable "GRADLE_USER_HOME" (Join-DevPath "Caches\gradle")
Set-UserEnvironmentVariable "ANDROID_HOME" $androidSdkPath
Set-UserEnvironmentVariable "ANDROID_SDK_ROOT" $androidSdkPath
Set-UserEnvironmentVariable "ANDROID_AVD_HOME" (Join-DevPath "Android\Avd")
Set-UserEnvironmentVariable "DAILY_NAGGER_NINJA" $ninjaPath

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

Enable-WindowsLongPaths
git config --global core.longpaths true
Write-Host "git core.longpaths=true"

Add-UserPathEntry (Join-Path $androidSdkPath "platform-tools")
Add-UserPathEntry (Join-Path $androidSdkPath "cmdline-tools\latest\bin")
Add-UserPathEntry (Join-DevPath "Programs\ninja")

Write-Host "DailyNagger machine paths configured. Open a new terminal before validating tools."
