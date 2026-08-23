<#
.SYNOPSIS
Runs the safe production deploy chain.

.DESCRIPTION
Backs up the production databases first. Deploy only starts if backup succeeds.
#>

param(
    [string]$RepoRootPath,
    [string]$SshKeyPath = $env:DAILY_NAGGER_DEPLOY_SSH_KEY,
    [string]$VpsHost = $env:DAILY_NAGGER_DEPLOY_HOST,
    [string]$VpsUser = "root",
    [string]$RemotePath = "/opt/dailynagger",
    [string]$LocalBackupRootPath = "E:\Backups\DailyNagger\server-db",
    [string]$ImageTag = ("server-" + (Get-Date -Format "yyyyMMdd-HHmm")),
    [switch]$SkipMigrations,
    [switch]$Notify
)

$ErrorActionPreference = "Stop"

$repoRoot = if ([string]::IsNullOrWhiteSpace($RepoRootPath)) {
    (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}
else {
    (Resolve-Path $RepoRootPath).Path
}

$backupStamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupScript = Join-Path $PSScriptRoot "backup-production-db.ps1"
$deployScript = Join-Path $PSScriptRoot "deploy-server.ps1"

Write-Host "Starting DailyNagger production deploy chain..."
Write-Host "Image tag: $ImageTag"
Write-Host "Backup stamp: $backupStamp"

& $backupScript `
    -SshKeyPath $SshKeyPath `
    -VpsHost $VpsHost `
    -VpsUser $VpsUser `
    -RemotePath $RemotePath `
    -LocalBackupRootPath $LocalBackupRootPath `
    -BackupStamp $backupStamp `
    -Notify:$Notify

& $deployScript `
    -RepoRootPath $repoRoot `
    -SshKeyPath $SshKeyPath `
    -VpsHost $VpsHost `
    -VpsUser $VpsUser `
    -RemotePath $RemotePath `
    -ImageTag $ImageTag `
    -SkipMigrations:$SkipMigrations `
    -Notify:$Notify

Write-Host "Production deploy chain completed: $ImageTag"
