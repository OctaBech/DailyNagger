<#
.SYNOPSIS
Shows production rollback candidates without changing the VPS.

.PARAMETER SshKeyPath
SSH private key used to connect to the VPS. Can also be supplied with
DAILY_NAGGER_DEPLOY_SSH_KEY.

.PARAMETER VpsHost
VPS hostname or IP address. Can also be supplied with DAILY_NAGGER_DEPLOY_HOST.

.PARAMETER VpsUser
SSH user on the VPS.

.PARAMETER RemotePath
Deployment folder on the VPS.

.PARAMETER KnownHostsPath
SSH known_hosts file used to verify the VPS host. Can also be supplied with
DAILY_NAGGER_DEPLOY_KNOWN_HOSTS.
#>

param(
    [string]$SshKeyPath = $env:DAILY_NAGGER_DEPLOY_SSH_KEY,
    [string]$VpsHost = $env:DAILY_NAGGER_DEPLOY_HOST,
    [string]$VpsUser = "root",
    [string]$RemotePath = "/opt/dailynagger",
    [string]$KnownHostsPath = $env:DAILY_NAGGER_DEPLOY_KNOWN_HOSTS
)

$ErrorActionPreference = "Stop"

function Assert-LastExitCode {
    param([string]$CommandName)

    if ($LASTEXITCODE -ne 0) {
        throw "$CommandName failed with exit code $LASTEXITCODE."
    }
}

if ([string]::IsNullOrWhiteSpace($VpsHost)) {
    throw "Missing VPS host. Pass -VpsHost or set DAILY_NAGGER_DEPLOY_HOST."
}

if ([string]::IsNullOrWhiteSpace($SshKeyPath)) {
    throw "Missing SSH key path. Pass -SshKeyPath or set DAILY_NAGGER_DEPLOY_SSH_KEY."
}

$destination = "${VpsUser}@${VpsHost}"
$sshOptions = @("-i", $SshKeyPath)

if (![string]::IsNullOrWhiteSpace($KnownHostsPath)) {
    $sshOptions += @("-o", "UserKnownHostsFile=$KnownHostsPath")
}

Write-Host "Inspecting DailyNagger production rollback candidates..."
Write-Host "VPS: $destination"
Write-Host "Remote path: $RemotePath"

$remoteScript = @'
set -euo pipefail

remote_path="$1"

cd "$remote_path"
test -f compose.prod.yaml
test -f .env

read_image_tag() {
  env_file="$1"
  if [ ! -f "$env_file" ]; then
    return 0
  fi

  grep '^DAILY_NAGGER_IMAGE_TAG=' "$env_file" | tail -n 1 | cut -d= -f2-
}

current_tag="$(read_image_tag .env)"

printf 'Current image tag:\n'
printf '  %s\n\n' "${current_tag:-<missing>}"

printf 'Recent .env backups:\n'
find . -maxdepth 1 -type f -name '.env.backup-server-*' -printf '%f\n' |
  sort -r |
  head -n 8 |
  while IFS= read -r backup_file; do
    backup_tag="$(read_image_tag "$backup_file")"
    printf '  %-34s -> %s\n' "$backup_file" "${backup_tag:-<missing>}"
  done

printf '\nAvailable dailynagger-server images:\n'
docker image ls dailynagger-server --format '  {{.Repository}}:{{.Tag}}\t{{.ID}}\t{{.CreatedSince}}\t{{.Size}}'

printf '\nRunning production services:\n'
services="$(docker compose -f compose.prod.yaml config --services)"
printf '%s\n' "$services" | sed 's/^/  /'

printf '\nProduction service status:\n'
docker compose -f compose.prod.yaml ps
'@

$remoteScript = $remoteScript -replace "`r", ""

$remoteScript | & ssh @sshOptions $destination "tr -d '\r' | bash -s -- '$RemotePath'"
Assert-LastExitCode "ssh inspect production rollback"
