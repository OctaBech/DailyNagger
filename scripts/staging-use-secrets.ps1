<#
.SYNOPSIS
Loads DailyNagger staging settings into the current PowerShell session.

.DESCRIPTION
Sets the environment variables used by staging database copy and staging mobile
APK builds. This script does not deploy, copy databases, build APKs, or print
secret values.
#>

param(
    [string]$SecretsRootPath = "E:\Secrets\DailyNagger",
    [string]$StagingEnvPath,
    [string]$VpsHost = "46.225.130.77",
    [string]$SshKeyPath,
    [string]$KnownHostsPath
)

$ErrorActionPreference = "Stop"

function Import-DotEnv {
    param([string]$Path)

    Get-Content $Path |
        Where-Object { $_ -match "^\s*[^#][^=]+=" } |
        ForEach-Object {
            $name, $value = $_ -split "=", 2
            $name = $name.Trim()
            $value = $value.Trim()

            if (
                ($value.StartsWith('"') -and $value.EndsWith('"')) -or
                ($value.StartsWith("'") -and $value.EndsWith("'"))
            ) {
                $value = $value.Substring(1, $value.Length - 2)
            }

            Set-Item -Path "Env:$name" -Value $value
        }
}

$resolvedSecretsRoot = (Resolve-Path $SecretsRootPath).Path

if ([string]::IsNullOrWhiteSpace($StagingEnvPath)) {
    $StagingEnvPath = Join-Path $resolvedSecretsRoot "env\staging.env"
}

if ([string]::IsNullOrWhiteSpace($SshKeyPath)) {
    $SshKeyPath = Join-Path $resolvedSecretsRoot "ssh\dailynagger_hetzner"
}

if ([string]::IsNullOrWhiteSpace($KnownHostsPath)) {
    $KnownHostsPath = Join-Path $resolvedSecretsRoot "ssh\known_hosts"
}

if (!(Test-Path $StagingEnvPath)) {
    throw "Staging env file not found: $StagingEnvPath"
}

if (!(Test-Path $SshKeyPath)) {
    throw "SSH key not found: $SshKeyPath"
}

if (!(Test-Path $KnownHostsPath)) {
    throw "known_hosts file not found: $KnownHostsPath"
}

Import-DotEnv $StagingEnvPath

$env:DAILY_NAGGER_DEPLOY_HOST = $VpsHost
$env:DAILY_NAGGER_DEPLOY_SSH_KEY = (Resolve-Path $SshKeyPath).Path
$env:DAILY_NAGGER_DEPLOY_KNOWN_HOSTS = (Resolve-Path $KnownHostsPath).Path
$env:DAILY_NAGGER_STAGING_ENV_PATH = (Resolve-Path $StagingEnvPath).Path

Write-Host "DailyNagger staging session variables loaded."
Write-Host "VPS host: $env:DAILY_NAGGER_DEPLOY_HOST"
Write-Host "staging env path: $env:DAILY_NAGGER_STAGING_ENV_PATH"
Write-Host "staging community id: $env:EXPO_PUBLIC_DAILY_NAGGER_COMMUNITY_ID"
Write-Host "staging data DB: $env:DAILY_NAGGER_STAGING_DATA_DB"
Write-Host "API base URL: $env:EXPO_PUBLIC_DAILY_NAGGER_API_BASE_URL"
Write-Host "API token: configured"
Write-Host ""
Write-Host "This PowerShell session can now run:"
Write-Host "  .\scripts\staging-copy-production-db.ps1"
Write-Host "  .\scripts\staging-build-mobile-apk.ps1 -Notify"
