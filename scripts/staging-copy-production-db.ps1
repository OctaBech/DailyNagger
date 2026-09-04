<#
.SYNOPSIS
Refreshes the isolated staging SQL container from production data.

.DESCRIPTION
Runs on the VPS through SSH. Production SQL is used only as a backup source.
The staging SQL container and its volume are recreated, then the production data
backup is restored into the staging SQL container.

This script does not change production data or production control routing.
#>

param(
    [string]$SshKeyPath = $env:DAILY_NAGGER_DEPLOY_SSH_KEY,
    [string]$VpsHost = $env:DAILY_NAGGER_DEPLOY_HOST,
    [string]$VpsUser = "root",
    [string]$RemotePath = "/opt/dailynagger",
    [string]$KnownHostsPath = $env:DAILY_NAGGER_DEPLOY_KNOWN_HOSTS,
    [string]$StagingContainerName = "dailynagger-staging-sqlserver",
    [string]$StagingVolumeName = "dailynagger_staging-sqlserver-data",
    [string]$DockerNetworkName = "dailynagger_default"
)

$ErrorActionPreference = "Stop"

function Assert-LastExitCode {
    param([string]$CommandName)

    if ($LASTEXITCODE -ne 0) {
        throw "$CommandName failed with exit code $LASTEXITCODE."
    }
}

function New-TemporaryShellScript {
    param([string]$Content)

    $path = Join-Path ([System.IO.Path]::GetTempPath()) "dailynagger-staging-copy-$([Guid]::NewGuid()).sh"
    [System.IO.File]::WriteAllText($path, $Content.Replace("`r`n", "`n"), [System.Text.UTF8Encoding]::new($false))

    return $path
}

if ([string]::IsNullOrWhiteSpace($VpsHost)) {
    throw "Missing VPS host. Run .\scripts\staging-use-secrets.ps1 first."
}

if ([string]::IsNullOrWhiteSpace($SshKeyPath)) {
    throw "Missing SSH key path. Run .\scripts\staging-use-secrets.ps1 first."
}

if ($StagingContainerName -notmatch "^[A-Za-z0-9_.-]+$") {
    throw "Invalid staging container name: $StagingContainerName"
}

if ($StagingVolumeName -notmatch "^[A-Za-z0-9_.-]+$") {
    throw "Invalid staging volume name: $StagingVolumeName"
}

if ($DockerNetworkName -notmatch "^[A-Za-z0-9_.-]+$") {
    throw "Invalid Docker network name: $DockerNetworkName"
}

$destination = "${VpsUser}@${VpsHost}"
$sshOptions = @("-i", $SshKeyPath)

if (![string]::IsNullOrWhiteSpace($KnownHostsPath)) {
    $sshOptions += @("-o", "UserKnownHostsFile=$KnownHostsPath")
}

Write-Host "Refreshing isolated DailyNagger staging SQL container from production data."
Write-Host "Production SQL: compose service sqlserver"
Write-Host "Staging SQL container: $StagingContainerName"
Write-Host "Staging SQL volume: $StagingVolumeName"
Write-Host "Production data is not changed."
Write-Host "Production control routing is not changed."

$remoteScript = @'
set -euo pipefail

remote_path="$1"
staging_container="$2"
staging_volume="$3"
docker_network="$4"

cd "$remote_path"
test -f compose.prod.yaml
test -f .env

prod_container="$(docker compose -f compose.prod.yaml ps -q sqlserver)"
test -n "$prod_container"

sa_password="$(grep '^MSSQL_SA_PASSWORD=' .env | cut -d= -f2-)"
app_password="$(grep '^DAILY_NAGGER_SQL_APP_PASSWORD=' .env | cut -d= -f2-)"
test -n "$sa_password"
test -n "$app_password"

backup_stamp="$(date +%Y%m%d-%H%M%S)"
prod_backup_dir="/var/opt/mssql/backup/staging-safe"
prod_backup_file="${prod_backup_dir}/DailyNaggerData-${backup_stamp}.bak"
host_transfer_dir="${remote_path}/staging-transfer"
host_backup_file="${host_transfer_dir}/DailyNaggerData-${backup_stamp}.bak"
staging_backup_file="/var/opt/mssql/backup/DailyNaggerData-from-production.bak"

printf 'Creating production data backup...\n'
docker exec "$prod_container" mkdir -p "$prod_backup_dir"
docker exec "$prod_container" /opt/mssql-tools18/bin/sqlcmd \
  -S localhost \
  -U sa \
  -P "$sa_password" \
  -C \
  -b \
  -Q "BACKUP DATABASE [DailyNaggerData] TO DISK = N'${prod_backup_file}' WITH INIT, COMPRESSION, CHECKSUM"

printf 'Recreating isolated staging SQL container...\n'
docker rm -f "$staging_container" >/dev/null 2>&1 || true
docker volume rm "$staging_volume" >/dev/null 2>&1 || true
docker run -d \
  --name "$staging_container" \
  --network "$docker_network" \
  --restart unless-stopped \
  -e ACCEPT_EULA=Y \
  -e MSSQL_SA_PASSWORD="$sa_password" \
  -v "${staging_volume}:/var/opt/mssql" \
  mcr.microsoft.com/mssql/server:2022-latest >/dev/null

printf 'Waiting for staging SQL...\n'
until docker exec "$staging_container" /opt/mssql-tools18/bin/sqlcmd \
  -S localhost \
  -U sa \
  -P "$sa_password" \
  -C \
  -Q "SELECT 1" >/dev/null 2>&1; do
  sleep 2
done

printf 'Copying backup into staging SQL container...\n'
mkdir -p "$host_transfer_dir"
docker cp "${prod_container}:${prod_backup_file}" "$host_backup_file"
docker exec "$staging_container" mkdir -p /var/opt/mssql/backup
docker cp "$host_backup_file" "${staging_container}:${staging_backup_file}"
docker exec -u root "$staging_container" bash -lc \
  'chown -R mssql:mssql /var/opt/mssql/backup && chmod -R u+rwX /var/opt/mssql/backup'

printf 'Restoring DailyNaggerData in staging SQL container...\n'
cat <<SQL | docker exec -i "$staging_container" /opt/mssql-tools18/bin/sqlcmd \
  -S localhost \
  -U sa \
  -P "$sa_password" \
  -C \
  -b
set nocount on;

restore database DailyNaggerData
from disk = N'${staging_backup_file}'
with
  move N'DailyNaggerData' to N'/var/opt/mssql/data/DailyNaggerData.mdf',
  move N'DailyNaggerData_log' to N'/var/opt/mssql/data/DailyNaggerData_log.ldf',
  replace,
  recovery;
SQL

printf 'Applying app login and permissions in staging SQL...\n'
cat <<SQL | docker exec -i "$staging_container" /opt/mssql-tools18/bin/sqlcmd \
  -S localhost \
  -U sa \
  -P "$sa_password" \
  -C \
  -b
set nocount on;

if exists (select 1 from sys.sql_logins where name = 'DailyNaggerApp')
  alter login DailyNaggerApp with password = '${app_password}';
else
  create login DailyNaggerApp with password = '${app_password}';
SQL

cat <<SQL | docker exec -i "$staging_container" /opt/mssql-tools18/bin/sqlcmd \
  -S localhost \
  -U sa \
  -P "$sa_password" \
  -C \
  -b \
  -d DailyNaggerData
set nocount on;

if exists (select 1 from sys.database_principals where name = 'DailyNaggerApp')
  alter user DailyNaggerApp with login = DailyNaggerApp;
else
  create user DailyNaggerApp for login DailyNaggerApp;

if is_rolemember('db_datareader', 'DailyNaggerApp') = 0
  alter role db_datareader add member DailyNaggerApp;

if is_rolemember('db_datawriter', 'DailyNaggerApp') = 0
  alter role db_datawriter add member DailyNaggerApp;
SQL

printf 'Verifying staging data...\n'
docker exec "$staging_container" /opt/mssql-tools18/bin/sqlcmd \
  -S localhost \
  -U sa \
  -P "$sa_password" \
  -C \
  -b \
  -W \
  -d DailyNaggerData \
  -Q "set nocount on; select count(*) as nag_count from nag;"

printf 'Staging SQL container was refreshed from production data.\n'
'@

$remoteScriptPath = New-TemporaryShellScript $remoteScript

try {
    Get-Content -LiteralPath $remoteScriptPath -Raw |
        & ssh @sshOptions $destination "bash -s -- '$RemotePath' '$StagingContainerName' '$StagingVolumeName' '$DockerNetworkName'"
    Assert-LastExitCode "ssh staging database copy"
}
finally {
    Remove-Item -LiteralPath $remoteScriptPath -Force -ErrorAction SilentlyContinue
}
