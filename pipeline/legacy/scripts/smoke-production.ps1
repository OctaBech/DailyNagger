<#
.SYNOPSIS
Runs production smoke checks through the VPS.

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

Write-Host "Running DailyNagger production smoke checks..."
Write-Host "VPS: $destination"
Write-Host "Remote path: $RemotePath"

$remoteScript = @'
set -euo pipefail

remote_path="$1"

cd "$remote_path"
test -f compose.prod.yaml
test -f .env

public_host="$(grep '^DAILY_NAGGER_PUBLIC_HOST=' .env | cut -d= -f2-)"
api_token="$(grep '^DAILY_NAGGER_API_TOKEN=' .env | cut -d= -f2-)"
test -n "$public_host"
test -n "$api_token"

request_id="$(cat /proc/sys/kernel/random/uuid)"
today="$(date +%F)"

curl -fsS \
  -H "X-DailyNagger-Request-Id: ${request_id}" \
  "https://${public_host}/api/health" > /dev/null

curl -fsS \
  -H "X-DailyNagger-Request-Id: ${request_id}" \
  "https://${public_host}/api/health/database" > /dev/null

curl -fsS \
  -H "X-DailyNagger-Request-Id: ${request_id}" \
  --oauth2-bearer "$api_token" \
  -G "https://${public_host}/api/todays-nag-plan" \
  --data-urlencode communityId=22222222-2222-2222-2222-222222222222 \
  --data-urlencode userId=11111111-1111-1111-1111-111111111111 \
  --data-urlencode date="$today" > /dev/null

printf 'Production smoke checks passed for https://%s with request id %s\n' "$public_host" "$request_id"
'@

$remoteScript | & ssh @sshOptions $destination "bash -s -- '$RemotePath'"
Assert-LastExitCode "ssh production smoke check"
