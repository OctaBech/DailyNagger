<#
.SYNOPSIS
Restores a DailyNagger checkout into a usable development state.

.DESCRIPTION
Checks required tools, restores .NET packages, installs mobile npm packages,
and can optionally start local Docker services and run basic verification.

This script does not install system tools such as Docker, .NET, Node.js, npm,
or Android tooling. If a required tool is missing, it stops and tells you what
to install manually.

.PARAMETER RepoRootPath
Repository root to bootstrap. Defaults to the parent folder of this script.

.PARAMETER SkipMobileInstall
Skips npm install for the mobile project.

.PARAMETER StartDocker
Starts the local Docker Compose services after dependency restore.

.PARAMETER RunChecks
Runs build/typecheck/lint after restore.

.PARAMETER Notify
Plays a local Windows sound when the bootstrap finishes or fails.

.EXAMPLE
.\scripts\bootstrap-dev.ps1

Restores .NET and mobile npm dependencies.

.EXAMPLE
.\scripts\bootstrap-dev.ps1 -StartDocker -RunChecks -Notify

Restores dependencies, starts local Docker services, runs verification, and
plays a sound when done.
#>

param(
    [string]$RepoRootPath,
    [switch]$SkipMobileInstall,
    [switch]$StartDocker,
    [switch]$RunChecks,
    [switch]$Notify
)

$ErrorActionPreference = "Stop"

function Assert-LastExitCode {
    param([string]$CommandName)

    if ($LASTEXITCODE -ne 0) {
        throw "$CommandName failed with exit code $LASTEXITCODE."
    }
}

function Invoke-BootstrapNotification {
    param([bool]$Succeeded)

    if (!$Notify) {
        return
    }

    if ($Succeeded) {
        [System.Media.SystemSounds]::Asterisk.Play()
        Start-Sleep -Milliseconds 180
        [System.Media.SystemSounds]::Asterisk.Play()
        return
    }

    [System.Media.SystemSounds]::Hand.Play()
}

function Assert-CommandAvailable {
    param(
        [string]$CommandName,
        [string]$InstallHint
    )

    if (Get-Command $CommandName -ErrorAction SilentlyContinue) {
        return
    }

    throw "Missing required tool '$CommandName'. Install it manually first. $InstallHint"
}

try {
    $repoRoot = if ([string]::IsNullOrWhiteSpace($RepoRootPath)) {
        (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
    }
    else {
        (Resolve-Path $RepoRootPath).Path
    }

    $solutionPath = Join-Path $repoRoot "DailyNagger.sln"
    $mobileProject = Join-Path $repoRoot "src\DailyNagger.Mobile"

    Write-Host "Bootstrapping DailyNagger development checkout..."
    Write-Host "Repo root: $repoRoot"

    Assert-CommandAvailable "git" "Install Git for Windows."
    Assert-CommandAvailable "dotnet" "Install the .NET SDK version from global.json."
    Assert-CommandAvailable "node" "Install Node.js."
    Assert-CommandAvailable "npm" "Install npm with Node.js."

    if ($StartDocker) {
        Assert-CommandAvailable "docker" "Install and start Docker Desktop."
    }

    Write-Host "Restoring .NET packages..."
    & dotnet restore $solutionPath
    Assert-LastExitCode "dotnet restore"

    if (!$SkipMobileInstall) {
        Write-Host "Installing mobile npm packages..."
        & npm install --prefix $mobileProject
        Assert-LastExitCode "npm install mobile"
    }

    if ($StartDocker) {
        Write-Host "Starting local Docker services..."
        & docker compose -f (Join-Path $repoRoot "compose.yaml") up -d
        Assert-LastExitCode "docker compose up"
    }

    if ($RunChecks) {
        Write-Host "Running .NET build..."
        & dotnet build $solutionPath --no-restore
        Assert-LastExitCode "dotnet build"

        Write-Host "Running mobile typecheck..."
        & npm run typecheck --prefix $mobileProject
        Assert-LastExitCode "mobile typecheck"

        Write-Host "Running mobile lint..."
        & npm run lint --prefix $mobileProject
        Assert-LastExitCode "mobile lint"
    }

    if (!(Test-Path (Join-Path $repoRoot ".env"))) {
        Write-Host "Root .env is missing. Copy values from .env.example when you need local Docker/API config."
    }

    if (!(Test-Path (Join-Path $mobileProject ".env"))) {
        Write-Host "Mobile .env is missing. Copy values from src\DailyNagger.Mobile\.env.example before running the app."
    }

    Write-Host "DailyNagger bootstrap completed."
    Invoke-BootstrapNotification -Succeeded $true
}
catch {
    Invoke-BootstrapNotification -Succeeded $false
    throw
}
