<#
.SYNOPSIS
Builds and deploys the DailyNagger server to the VPS.

.DESCRIPTION
Packages the server source, uploads it to the VPS, builds a uniquely tagged Docker image,
optionally runs EF migrations, restarts the production services, and runs smoke tests.

.PARAMETER RepoRootPath
Repository root to deploy from. Defaults to the parent folder of this script.

.PARAMETER SshKeyPath
SSH private key used to connect to the VPS. Can also be supplied with
DAILY_NAGGER_DEPLOY_SSH_KEY.

.PARAMETER VpsHost
VPS hostname or IP address. Can also be supplied with DAILY_NAGGER_DEPLOY_HOST.

.PARAMETER VpsUser
SSH user on the VPS.

.PARAMETER RemotePath
Deployment folder on the VPS.

.PARAMETER ImageTag
Docker image tag to build and run. Defaults to server-yyyyMMdd-HHmm.

.PARAMETER KnownHostsPath
SSH known_hosts file used to verify the VPS host. Can also be supplied with
DAILY_NAGGER_DEPLOY_KNOWN_HOSTS.

.PARAMETER SkipMigrations
Skips EF database migrations. Use this only when the target database schema is already up to date
and you only want to rebuild/restart the server image.

.PARAMETER Notify
Plays a local Windows sound when the deploy finishes or fails.

.EXAMPLE
.\scripts\deploy-server.ps1 -VpsHost "api.example.com" -SshKeyPath "$env:USERPROFILE\.ssh\dailynagger_deploy"

Deploys the server, runs migrations, restarts services, and smoke tests production.

.EXAMPLE
.\scripts\deploy-server.ps1 -SkipMigrations -Notify

Deploys code without running migrations and plays a sound when done. Requires
DAILY_NAGGER_DEPLOY_HOST and DAILY_NAGGER_DEPLOY_SSH_KEY to be set when the
corresponding parameters are omitted.
#>

param(
    [string]$RepoRootPath,
    [string]$SshKeyPath = $env:DAILY_NAGGER_DEPLOY_SSH_KEY,
    [string]$VpsHost = $env:DAILY_NAGGER_DEPLOY_HOST,
    [string]$VpsUser = "root",
    [string]$RemotePath = "/opt/dailynagger",
    [string]$ImageTag = ("server-" + (Get-Date -Format "yyyyMMdd-HHmm")),
    [string]$KnownHostsPath = $env:DAILY_NAGGER_DEPLOY_KNOWN_HOSTS,
    [switch]$SkipMigrations,
    [switch]$Notify
)

$ErrorActionPreference = "Stop"

function Assert-LastExitCode {
    param([string]$CommandName)

    if ($LASTEXITCODE -ne 0) {
        throw "$CommandName failed with exit code $LASTEXITCODE."
    }
}

function Invoke-DeployNotification {
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

function Invoke-RemoteBash {
    param(
        [string]$Script,
        [string[]]$Arguments = @()
    )

    $tempScriptPath = Join-Path ([System.IO.Path]::GetTempPath()) ("dailynagger-remote-" + [Guid]::NewGuid().ToString("N") + ".sh")
    $remoteScriptPath = "/tmp/" + [System.IO.Path]::GetFileName($tempScriptPath)
    $destination = "${VpsUser}@${VpsHost}"
    $sshOptions = @("-i", $SshKeyPath)

    if (![string]::IsNullOrWhiteSpace($KnownHostsPath)) {
        $sshOptions += @("-o", "UserKnownHostsFile=$KnownHostsPath")
    }

    try {
        $Script | Set-Content -Path $tempScriptPath -NoNewline

        & scp @sshOptions $tempScriptPath "${destination}:${remoteScriptPath}"
        Assert-LastExitCode "scp remote bash script"

        $sshArguments = $sshOptions + @($destination, "bash", $remoteScriptPath) + $Arguments
        & ssh @sshArguments
        Assert-LastExitCode "ssh remote bash"
    }
    finally {
        if (Test-Path $tempScriptPath) {
            Remove-Item $tempScriptPath -Force
        }

        & ssh @sshOptions $destination "rm -f $remoteScriptPath" > $null 2>&1
    }
}

try {
    if ([string]::IsNullOrWhiteSpace($VpsHost)) {
        throw "Missing VPS host. Pass -VpsHost or set DAILY_NAGGER_DEPLOY_HOST."
    }

    if ([string]::IsNullOrWhiteSpace($SshKeyPath)) {
        throw "Missing SSH key path. Pass -SshKeyPath or set DAILY_NAGGER_DEPLOY_SSH_KEY."
    }

    $repoRoot = if ([string]::IsNullOrWhiteSpace($RepoRootPath)) {
        (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
    }
    else {
        (Resolve-Path $RepoRootPath).Path
    }

    $archivePath = Join-Path $repoRoot "dailynagger-source.tar.gz"
    $packScript = Join-Path $repoRoot "scripts\pack-server-deploy-source.ps1"
    $destination = "${VpsUser}@${VpsHost}"
    $sshOptions = @("-i", $SshKeyPath)

    if (![string]::IsNullOrWhiteSpace($KnownHostsPath)) {
        $sshOptions += @("-o", "UserKnownHostsFile=$KnownHostsPath")
    }

    Write-Host "Deploying DailyNagger server..."
    Write-Host "Repo root: $repoRoot"
    Write-Host "VPS: $destination"
    Write-Host "Remote path: $RemotePath"
    Write-Host "Image tag: $ImageTag"

    & $packScript -RepoRoot $repoRoot -OutputPath $archivePath
    Assert-LastExitCode "pack-server-deploy-source.ps1"

    Write-Host "Preparing remote deploy folder..."
    & ssh @sshOptions $destination "mkdir -p '$RemotePath'"
    Assert-LastExitCode "ssh prepare remote deploy folder"

    Write-Host "Uploading deploy archive..."
    & scp @sshOptions $archivePath "${destination}:${RemotePath}/dailynagger-source.tar.gz"
    Assert-LastExitCode "scp deploy archive"

    Write-Host "Extracting source on VPS..."
    Invoke-RemoteBash -Arguments @($RemotePath) -Script @'
set -euo pipefail

remote_path="$1"

cd "$remote_path"
test "$(pwd)" = "$remote_path"

rm -rf "$remote_path/src/DailyNagger.Server"
tar -xzf dailynagger-source.tar.gz
cp "$remote_path/scripts/run-vps-ef-migration.sh" "$remote_path/run-vps-ef-migration.sh"
cp "$remote_path/scripts/run-vps-production-minimum-seed.sh" "$remote_path/run-vps-production-minimum-seed.sh"
cp "$remote_path/scripts/seed-production-minimum.sql" "$remote_path/seed-production-minimum.sql"

find "$remote_path/src/DailyNagger.Server" -type d \( -name bin -o -name obj \) -prune -exec rm -rf {} +
find "$remote_path" -type d -exec chmod 755 {} +
find "$remote_path" -type f -exec chmod 644 {} +
chmod 600 "$remote_path/.env"
chmod 755 "$remote_path/run-vps-ef-migration.sh"
chmod 755 "$remote_path/run-vps-production-minimum-seed.sh"

test -f "$remote_path/src/DailyNagger.Server/DailyNagger.Server.csproj"
test -f "$remote_path/compose.prod.yaml"
test -f "$remote_path/deploy/Caddyfile"
'@

    Write-Host "Building server image on VPS..."
    Invoke-RemoteBash -Arguments @($RemotePath, $ImageTag) -Script @'
set -euo pipefail

remote_path="$1"
image_tag="$2"

cd "$remote_path"
cp .env ".env.backup-${image_tag}"

if grep -q '^DAILY_NAGGER_IMAGE_TAG=' .env; then
  sed -i "s/^DAILY_NAGGER_IMAGE_TAG=.*/DAILY_NAGGER_IMAGE_TAG=${image_tag}/" .env
else
  printf '\nDAILY_NAGGER_IMAGE_TAG=%s\n' "$image_tag" >> .env
fi

docker compose -f compose.prod.yaml build server
docker image ls dailynagger-server --format 'table {{.Repository}}:{{.Tag}}\t{{.ID}}\t{{.Size}}'
'@

    if (!$SkipMigrations) {
        Write-Host "Applying production EF migrations..."
        Invoke-RemoteBash -Arguments @($RemotePath) -Script @'
set -euo pipefail

remote_path="$1"

cd "$remote_path"
./run-vps-ef-migration.sh DailyNaggerDbContext
./run-vps-ef-migration.sh DailyNaggerControlDbContext
'@
    }

    Write-Host "Restarting production server..."
    Invoke-RemoteBash -Arguments @($RemotePath) -Script @'
set -euo pipefail

remote_path="$1"

cd "$remote_path"
docker compose -f compose.prod.yaml up -d server reverse-proxy
docker compose -f compose.prod.yaml ps
'@

    Write-Host "Running smoke checks..."
    Invoke-RemoteBash -Arguments @($RemotePath) -Script @'
set -euo pipefail

remote_path="$1"

cd "$remote_path"
public_host="$(grep '^DAILY_NAGGER_PUBLIC_HOST=' .env | cut -d= -f2-)"
api_token="$(grep '^DAILY_NAGGER_API_TOKEN=' .env | cut -d= -f2-)"
request_id="$(cat /proc/sys/kernel/random/uuid)"

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
  --data-urlencode date="$(date +%F)" > /dev/null

printf 'Smoke checks passed for https://%s with request id %s\n' "$public_host" "$request_id"
'@

    Write-Host "Server deploy completed: $ImageTag"
    Invoke-DeployNotification -Succeeded $true
}
catch {
    Invoke-DeployNotification -Succeeded $false
    throw
}
