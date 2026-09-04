<#
.SYNOPSIS
Builds and installs a DailyNagger staging Android APK.

.DESCRIPTION
Uses the staging env file prepared by staging-use-secrets.ps1, or the default
E:\Secrets\DailyNagger\env\staging.env file, then delegates to the normal local
release APK build script.
#>

param(
    [string]$RepoRootPath,
    [string]$MobileProjectPath,
    [string]$StagingEnvPath = $env:DAILY_NAGGER_STAGING_ENV_PATH,
    [string]$DevCacheRootPath = "E:\Caches",
    [string]$AndroidSdkPath,
    [string]$DeviceId,
    [switch]$SkipInstall,
    [switch]$Notify
)

$ErrorActionPreference = "Stop"

$repoRoot = if ([string]::IsNullOrWhiteSpace($RepoRootPath)) {
    (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}
else {
    (Resolve-Path $RepoRootPath).Path
}

if ([string]::IsNullOrWhiteSpace($StagingEnvPath)) {
    $StagingEnvPath = "E:\Secrets\DailyNagger\env\staging.env"
}

if (!(Test-Path $StagingEnvPath)) {
    throw "Staging env file not found: $StagingEnvPath. Run .\scripts\staging-use-secrets.ps1 first."
}

Write-Host "Building DailyNagger staging APK."
Write-Host "Staging env path: $StagingEnvPath"

& (Join-Path $repoRoot "scripts\build-mobile-release-apk.ps1") `
    -RepoRootPath $repoRoot `
    -MobileProjectPath $MobileProjectPath `
    -EnvPath $StagingEnvPath `
    -DevCacheRootPath $DevCacheRootPath `
    -AndroidSdkPath $AndroidSdkPath `
    -DeviceId $DeviceId `
    -SkipInstall:$SkipInstall `
    -Notify:$Notify
