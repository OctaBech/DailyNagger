param(
    [string]$RepoRootPath
)

$ErrorActionPreference = "Stop"

function Assert-LastExitCode {
    param([string]$CommandName)

    if ($LASTEXITCODE -ne 0) {
        throw "$CommandName failed with exit code $LASTEXITCODE."
    }
}

function Assert-DockerRunning {
    & docker info *> $null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker is not running. Start Docker Desktop before running server tests."
    }
}

$repoRoot = if ([string]::IsNullOrWhiteSpace($RepoRootPath)) {
    (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}
else {
    (Resolve-Path $RepoRootPath).Path
}

Push-Location $repoRoot
try {
    Assert-DockerRunning

    Write-Host "Starting SQL Server dependency..."
    & docker compose up -d sqlserver
    Assert-LastExitCode "docker compose up sqlserver"

    Write-Host "Waiting for SQL Server initialization..."
    & docker compose up --force-recreate --exit-code-from sqlserver-init sqlserver-init
    Assert-LastExitCode "docker compose up sqlserver-init"

    Write-Host "Running server tests..."
    & dotnet test DailyNagger.sln
    Assert-LastExitCode "dotnet test"
}
finally {
    Pop-Location
}
