<#
.SYNOPSIS
Loads DailyNagger production connection settings into the current PowerShell session.

.DESCRIPTION
Sets the environment variables used by the production deploy, backup, smoke, and Seq
scripts. This script does not deploy, back up, connect to the VPS, or print secret
values. It only prepares the current terminal session.

.PARAMETER SecretsRootPath
Root folder containing the DailyNagger secret files.

.PARAMETER VpsHost
Production VPS hostname or IP address.

.PARAMETER SshKeyPath
SSH private key path used by production scripts.

.PARAMETER KnownHostsPath
SSH known_hosts path used to verify the VPS host.
#>

param(
    [string]$SecretsRootPath = "E:\Secrets\DailyNagger",
    [string]$VpsHost = "46.225.130.77",
    [string]$SshKeyPath,
    [string]$KnownHostsPath
)

$ErrorActionPreference = "Stop"

$resolvedSecretsRoot = (Resolve-Path $SecretsRootPath).Path

if ([string]::IsNullOrWhiteSpace($SshKeyPath)) {
    $SshKeyPath = Join-Path $resolvedSecretsRoot "ssh\dailynagger_hetzner"
}

if ([string]::IsNullOrWhiteSpace($KnownHostsPath)) {
    $KnownHostsPath = Join-Path $resolvedSecretsRoot "ssh\known_hosts"
}

if ([string]::IsNullOrWhiteSpace($VpsHost)) {
    throw "Missing VPS host."
}

if (!(Test-Path $SshKeyPath)) {
    throw "SSH key not found: $SshKeyPath"
}

if (!(Test-Path $KnownHostsPath)) {
    throw "known_hosts file not found: $KnownHostsPath"
}

$env:DAILY_NAGGER_DEPLOY_HOST = $VpsHost
$env:DAILY_NAGGER_DEPLOY_SSH_KEY = (Resolve-Path $SshKeyPath).Path
$env:DAILY_NAGGER_DEPLOY_KNOWN_HOSTS = (Resolve-Path $KnownHostsPath).Path

Write-Host "DailyNagger production session variables loaded."
Write-Host "VPS host: $env:DAILY_NAGGER_DEPLOY_HOST"
Write-Host "SSH key path: $env:DAILY_NAGGER_DEPLOY_SSH_KEY"
Write-Host "known_hosts path: $env:DAILY_NAGGER_DEPLOY_KNOWN_HOSTS"
Write-Host ""
Write-Host "This PowerShell session can now run:"
Write-Host "  .\scripts\deploy-production.ps1 -Notify"
Write-Host "  .\scripts\backup-production-db.ps1 -Notify"
Write-Host "  .\scripts\smoke-production.ps1"
Write-Host "  .\scripts\open-production-seq.ps1"
