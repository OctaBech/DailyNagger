param(
    [string]$SqlServer = "localhost,1433",
    [string]$SqlUser = "sa",
    [string]$SqlPassword = "DailyNagger_dev_Password123!"
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$serverProject = Join-Path $repoRoot "src\DailyNagger.Server\DailyNagger.Server.csproj"
$seedScript = Join-Path $repoRoot "scripts\seed-local-dev-data.sql"

function Assert-LastExitCode {
    param([string]$CommandName)

    if ($LASTEXITCODE -ne 0) {
        throw "$CommandName failed with exit code $LASTEXITCODE."
    }
}

function Stop-LocalApi {
    Get-Process DailyNagger.Server -ErrorAction SilentlyContinue |
        Stop-Process -Force
}

function Invoke-Sql {
    param(
        [string]$Database,
        [string]$Query,
        [string]$InputFile
    )

    if ($InputFile) {
        & sqlcmd -S $SqlServer -d $Database -U $SqlUser -P $SqlPassword -C -b -i $InputFile
        Assert-LastExitCode "sqlcmd"
        return
    }

    & sqlcmd -S $SqlServer -d $Database -U $SqlUser -P $SqlPassword -C -b -Q $Query
    Assert-LastExitCode "sqlcmd"
}

Write-Host "Stopping local API process if it is running..."
Stop-LocalApi

Write-Host "Resetting local DailyNagger databases..."

Invoke-Sql -Database "master" -Query @"
if db_id('DailyNaggerData') is not null
begin
    alter database DailyNaggerData set single_user with rollback immediate;
    drop database DailyNaggerData;
end;

if db_id('DailyNaggerControl') is not null
begin
    alter database DailyNaggerControl set single_user with rollback immediate;
    drop database DailyNaggerControl;
end;

create database DailyNaggerData;
create database DailyNaggerControl;
"@

Write-Host "Applying EF migrations..."

& dotnet ef database update `
    --project $serverProject `
    --startup-project $serverProject `
    --context DailyNaggerControlDbContext
Assert-LastExitCode "dotnet ef DailyNaggerControlDbContext"

& dotnet ef database update `
    --project $serverProject `
    --startup-project $serverProject `
    --context DailyNaggerDbContext
Assert-LastExitCode "dotnet ef DailyNaggerDbContext"

Write-Host "Seeding local dev data..."
Invoke-Sql -Database "master" -InputFile $seedScript

Write-Host "Local databases reset and seeded."
