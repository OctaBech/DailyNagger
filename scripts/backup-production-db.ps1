<#
.SYNOPSIS
Backs up the DailyNagger production SQL Server databases from the VPS.

.PARAMETER SshKeyPath
SSH private key used to connect to the VPS. Can also be supplied with
DAILY_NAGGER_DEPLOY_SSH_KEY.

.PARAMETER VpsHost
VPS hostname or IP address. Can also be supplied with DAILY_NAGGER_DEPLOY_HOST.

.PARAMETER VpsUser
SSH user on the VPS.

.PARAMETER RemotePath
Deployment folder on the VPS.

.PARAMETER LocalBackupRootPath
Local folder where the downloaded backup folder is created.

.PARAMETER BackupStamp
Timestamp/name used for the backup folder.

.PARAMETER Notify
Plays a local Windows sound when backup finishes or fails.
#>

param(
    [string]$SshKeyPath = $env:DAILY_NAGGER_DEPLOY_SSH_KEY,
    [string]$VpsHost = $env:DAILY_NAGGER_DEPLOY_HOST,
    [string]$VpsUser = "root",
    [string]$RemotePath = "/opt/dailynagger",
    [string]$LocalBackupRootPath = "E:\Backups\DailyNagger\server-db",
    [string]$BackupStamp = (Get-Date -Format "yyyyMMdd-HHmmss"),
    [switch]$Notify
)

$ErrorActionPreference = "Stop"

function Assert-LastExitCode {
    param([string]$CommandName)

    if ($LASTEXITCODE -ne 0) {
        throw "$CommandName failed with exit code $LASTEXITCODE."
    }
}

function Invoke-BackupNotification {
    param([bool]$Succeeded)

    if (!$Notify) {
        return
    }

    if ($Succeeded) {
        [System.Media.SystemSounds]::Asterisk.Play()
        return
    }

    [System.Media.SystemSounds]::Hand.Play()
}

function Invoke-RemoteBash {
    param(
        [string]$Script,
        [string[]]$Arguments = @()
    )

    $tempScriptPath = Join-Path ([System.IO.Path]::GetTempPath()) ("dailynagger-backup-" + [Guid]::NewGuid().ToString("N") + ".sh")
    $remoteScriptPath = "/tmp/" + [System.IO.Path]::GetFileName($tempScriptPath)
    $destination = "${VpsUser}@${VpsHost}"

    try {
        $Script | Set-Content -Path $tempScriptPath -NoNewline

        & scp -i $SshKeyPath $tempScriptPath "${destination}:${remoteScriptPath}"
        Assert-LastExitCode "scp remote backup script"

        $sshArguments = @("-i", $SshKeyPath, $destination, "bash", $remoteScriptPath) + $Arguments
        & ssh @sshArguments
        Assert-LastExitCode "ssh remote backup script"
    }
    finally {
        if (Test-Path $tempScriptPath) {
            Remove-Item $tempScriptPath -Force
        }

        & ssh -i $SshKeyPath $destination "rm -f $remoteScriptPath" > $null 2>&1
    }
}

try {
    if ([string]::IsNullOrWhiteSpace($VpsHost)) {
        throw "Missing VPS host. Pass -VpsHost or set DAILY_NAGGER_DEPLOY_HOST."
    }

    if ([string]::IsNullOrWhiteSpace($SshKeyPath)) {
        throw "Missing SSH key path. Pass -SshKeyPath or set DAILY_NAGGER_DEPLOY_SSH_KEY."
    }

    $destination = "${VpsUser}@${VpsHost}"
    $localBackupPath = Join-Path $LocalBackupRootPath $BackupStamp
    $remoteBackupPath = "${RemotePath}/backups/${BackupStamp}"

    New-Item -ItemType Directory -Force $localBackupPath | Out-Null

    Write-Host "Backing up DailyNagger production databases..."
    Write-Host "VPS: $destination"
    Write-Host "Remote backup path: $remoteBackupPath"
    Write-Host "Local backup path: $localBackupPath"

    Invoke-RemoteBash -Arguments @($RemotePath, $BackupStamp) -Script @'
set -euo pipefail

remote_path="$1"
backup_stamp="$2"
container_backup_path="/var/opt/mssql/backup/${backup_stamp}"
remote_backup_path="${remote_path}/backups/${backup_stamp}"

cd "$remote_path"
test -f compose.prod.yaml
test -f .env

mkdir -p "$remote_backup_path"
docker compose -f compose.prod.yaml exec -T sqlserver mkdir -p "$container_backup_path"

sa_password="$(grep '^MSSQL_SA_PASSWORD=' .env | cut -d= -f2-)"
test -n "$sa_password"

for database_name in DailyNaggerData DailyNaggerControl; do
  backup_file="${database_name}-${backup_stamp}.bak"
  docker compose -f compose.prod.yaml exec -T sqlserver /opt/mssql-tools18/bin/sqlcmd \
    -S localhost \
    -U sa \
    -P "$sa_password" \
    -C \
    -Q "BACKUP DATABASE [${database_name}] TO DISK = N'${container_backup_path}/${backup_file}' WITH INIT, COMPRESSION, CHECKSUM"

  container_id="$(docker compose -f compose.prod.yaml ps -q sqlserver)"
  docker cp "${container_id}:${container_backup_path}/${backup_file}" "${remote_backup_path}/${backup_file}"
  test -s "${remote_backup_path}/${backup_file}"
done

sha256sum "${remote_backup_path}"/*.bak > "${remote_backup_path}/SHA256SUMS.txt"
ls -lh "$remote_backup_path"
'@

    Write-Host "Downloading database backups..."
    & scp -i $SshKeyPath "${destination}:${remoteBackupPath}/*" $localBackupPath
    Assert-LastExitCode "scp production database backups"

    Get-ChildItem $localBackupPath | Select-Object Name, Length, LastWriteTime

    Write-Host "Production database backup completed: $BackupStamp"
    Invoke-BackupNotification -Succeeded $true
}
catch {
    Invoke-BackupNotification -Succeeded $false
    throw
}
