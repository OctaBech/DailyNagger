<#
.SYNOPSIS
Replaces the staging data database with a copy of production data.

.DESCRIPTION
Runs on the VPS through SSH. Production data is backed up and restored into the
staging database name. Production data is not changed.
#>

param(
    [string]$SshKeyPath = $env:DAILY_NAGGER_DEPLOY_SSH_KEY,
    [string]$VpsHost = $env:DAILY_NAGGER_DEPLOY_HOST,
    [string]$VpsUser = "root",
    [string]$RemotePath = "/opt/dailynagger",
    [string]$KnownHostsPath = $env:DAILY_NAGGER_DEPLOY_KNOWN_HOSTS,
    [string]$StagingCommunityId = $env:EXPO_PUBLIC_DAILY_NAGGER_COMMUNITY_ID,
    [string]$StagingUserId = $env:EXPO_PUBLIC_DAILY_NAGGER_USER_ID,
    [string]$StagingDataDb = $env:DAILY_NAGGER_STAGING_DATA_DB,
    [string]$StagingCommunityName = "StagedNagger"
)

$ErrorActionPreference = "Stop"

function Assert-LastExitCode {
    param([string]$CommandName)

    if ($LASTEXITCODE -ne 0) {
        throw "$CommandName failed with exit code $LASTEXITCODE."
    }
}

if ([string]::IsNullOrWhiteSpace($VpsHost)) {
    throw "Missing VPS host. Run .\scripts\staging-use-secrets.ps1 first."
}

if ([string]::IsNullOrWhiteSpace($SshKeyPath)) {
    throw "Missing SSH key path. Run .\scripts\staging-use-secrets.ps1 first."
}

if ([string]::IsNullOrWhiteSpace($StagingCommunityId)) {
    throw "Missing staging community id. Set EXPO_PUBLIC_DAILY_NAGGER_COMMUNITY_ID."
}

if ([string]::IsNullOrWhiteSpace($StagingUserId)) {
    throw "Missing staging user id. Set EXPO_PUBLIC_DAILY_NAGGER_USER_ID."
}

if ([string]::IsNullOrWhiteSpace($StagingDataDb)) {
    $StagingDataDb = "DailyNaggerData_Staging"
}

if ($StagingDataDb -notmatch "^[A-Za-z][A-Za-z0-9_]*$") {
    throw "Staging database name can only contain letters, numbers, and underscores, and must start with a letter."
}

$parsedCommunityId = [Guid]::Empty
if (![Guid]::TryParse($StagingCommunityId, [ref]$parsedCommunityId)) {
    throw "Staging community id must be a GUID."
}

$parsedUserId = [Guid]::Empty
if (![Guid]::TryParse($StagingUserId, [ref]$parsedUserId)) {
    throw "Staging user id must be a GUID."
}

$destination = "${VpsUser}@${VpsHost}"
$sshOptions = @("-i", $SshKeyPath)

if (![string]::IsNullOrWhiteSpace($KnownHostsPath)) {
    $sshOptions += @("-o", "UserKnownHostsFile=$KnownHostsPath")
}

Write-Host "Replacing DailyNagger staging data with a production copy."
Write-Host "Production database: DailyNaggerData"
Write-Host "Staging database: $StagingDataDb"
Write-Host "Staging community id: $StagingCommunityId"
Write-Host "Production data is not changed."

$remoteScript = @'
set -euo pipefail

remote_path="$1"
staging_community_id="$2"
staging_data_db="$3"
staging_community_name="$4"
staging_user_id="$5"

cd "$remote_path"
test -f compose.prod.yaml
test -f .env

sa_password="$(grep '^MSSQL_SA_PASSWORD=' .env | cut -d= -f2-)"
app_password="$(grep '^DAILY_NAGGER_SQL_APP_PASSWORD=' .env | cut -d= -f2-)"
test -n "$sa_password"
test -n "$app_password"

backup_stamp="$(date +%Y%m%d-%H%M%S)"
container_backup_path="/var/opt/mssql/backup/staging-copy-${backup_stamp}"
backup_file="${container_backup_path}/DailyNaggerData-${backup_stamp}.bak"

docker compose -f compose.prod.yaml exec -T sqlserver mkdir -p "$container_backup_path"

docker compose -f compose.prod.yaml exec -T sqlserver /opt/mssql-tools18/bin/sqlcmd \
  -S localhost \
  -U sa \
  -P "$sa_password" \
  -C \
  -b \
  -Q "BACKUP DATABASE [DailyNaggerData] TO DISK = N'${backup_file}' WITH INIT, COMPRESSION, CHECKSUM"

restore_sql="$(mktemp)"
cat > "$restore_sql" <<SQL
set nocount on;

declare @backupFile nvarchar(4000) = N'${backup_file}';
declare @stagingDb sysname = N'${staging_data_db}';
declare @dataFile nvarchar(4000) = N'/var/opt/mssql/data/${staging_data_db}.mdf';
declare @logFile nvarchar(4000) = N'/var/opt/mssql/data/${staging_data_db}_log.ldf';
declare @logicalDataName sysname;
declare @logicalLogName sysname;

declare @files table (
    LogicalName nvarchar(128),
    PhysicalName nvarchar(260),
    Type char(1),
    FileGroupName nvarchar(128) null,
    Size numeric(20,0),
    MaxSize numeric(20,0),
    FileId bigint,
    CreateLSN numeric(25,0) null,
    DropLSN numeric(25,0) null,
    UniqueId uniqueidentifier,
    ReadOnlyLSN numeric(25,0) null,
    ReadWriteLSN numeric(25,0) null,
    BackupSizeInBytes bigint,
    SourceBlockSize int,
    FileGroupId int,
    LogGroupGUID uniqueidentifier null,
    DifferentialBaseLSN numeric(25,0) null,
    DifferentialBaseGUID uniqueidentifier null,
    IsReadOnly bit,
    IsPresent bit,
    TDEThumbprint varbinary(32) null,
    SnapshotUrl nvarchar(360) null
);

insert into @files exec ('RESTORE FILELISTONLY FROM DISK = N''' + @backupFile + N'''');

select @logicalDataName = LogicalName from @files where Type = 'D';
select @logicalLogName = LogicalName from @files where Type = 'L';

if @logicalDataName is null or @logicalLogName is null
    throw 51000, 'Could not read logical file names from production backup.', 1;

if db_id(@stagingDb) is not null
begin
    exec ('alter database [' + @stagingDb + '] set single_user with rollback immediate');
    exec ('drop database [' + @stagingDb + ']');
end;

declare @restoreSql nvarchar(max) =
    N'restore database ' + quotename(@stagingDb) + N'
      from disk = @backupFile
      with
          move @logicalDataName to @dataFile,
          move @logicalLogName to @logFile,
          replace,
          recovery;';

exec sp_executesql
    @restoreSql,
    N'@backupFile nvarchar(4000), @logicalDataName sysname, @dataFile nvarchar(4000), @logicalLogName sysname, @logFile nvarchar(4000)',
    @backupFile = @backupFile,
    @logicalDataName = @logicalDataName,
    @dataFile = @dataFile,
    @logicalLogName = @logicalLogName,
    @logFile = @logFile;

declare @grantSql nvarchar(max) =
    N'use ' + quotename(@stagingDb) + N';

      if not exists (select 1 from sys.database_principals where name = ''DailyNaggerApp'')
          create user DailyNaggerApp for login DailyNaggerApp;

      if is_rolemember(''db_datareader'', ''DailyNaggerApp'') = 0
          alter role db_datareader add member DailyNaggerApp;

      if is_rolemember(''db_datawriter'', ''DailyNaggerApp'') = 0
          alter role db_datawriter add member DailyNaggerApp;';

exec (@grantSql);

use DailyNaggerControl;

if not exists (select 1 from user_profiles where Id = '${staging_user_id}')
begin
    insert into user_profiles (Id, DisplayName, Birthday)
    values ('${staging_user_id}', 'Martin', null);
end;

if exists (select 1 from nag_communities where Id = '${staging_community_id}')
begin
    update nag_communities
    set
        Name = '${staging_community_name}',
        ConnectionStringTemplate = 'Server=sqlserver,1433;Database=${staging_data_db};User Id=DailyNaggerApp;Encrypt=True;TrustServerCertificate=True',
        PasswordSecretName = null,
        is_deactivated = 0
    where Id = '${staging_community_id}';
end
else
begin
    insert into nag_communities (Id, Name, ConnectionStringTemplate, PasswordSecretName, is_deactivated)
    values (
        '${staging_community_id}',
        '${staging_community_name}',
        'Server=sqlserver,1433;Database=${staging_data_db};User Id=DailyNaggerApp;Encrypt=True;TrustServerCertificate=True',
        null,
        0
    );
end;

if not exists (
    select 1
    from nag_community_members
    where NagCommunityId = '${staging_community_id}'
      and UserId = '${staging_user_id}'
)
begin
    insert into nag_community_members (NagCommunityId, UserId)
    values ('${staging_community_id}', '${staging_user_id}');
end;
SQL

cat "$restore_sql" | docker compose -f compose.prod.yaml exec -T sqlserver /opt/mssql-tools18/bin/sqlcmd \
  -S localhost \
  -U sa \
  -P "$sa_password" \
  -C \
  -b

rm -f "$restore_sql"

printf 'Staging database %s now contains a production copy for community %s\n' "$staging_data_db" "$staging_community_id"
'@

$remoteScript | & ssh @sshOptions $destination "bash -s -- '$RemotePath' '$StagingCommunityId' '$StagingDataDb' '$StagingCommunityName' '$StagingUserId'"
Assert-LastExitCode "ssh staging database copy"
