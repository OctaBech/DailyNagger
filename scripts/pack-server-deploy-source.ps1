param(
    [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
    [string]$OutputPath = (Join-Path $RepoRoot "dailynagger-source.tar.gz")
)

$ErrorActionPreference = "Stop"

Push-Location $RepoRoot
try {
    if (Test-Path $OutputPath) {
        Remove-Item $OutputPath
    }

    tar `
        --exclude=.git `
        --exclude=artifacts `
        --exclude='**/bin' `
        --exclude='**/obj' `
        --exclude='**/*.csproj.user' `
        --exclude='**/appsettings.Local.json' `
        --exclude=src/DailyNagger.Mobile/node_modules `
        --exclude=src/DailyNagger.Client/node_modules `
        -czf $OutputPath `
        compose.prod.yaml `
        deploy `
        global.json `
        Directory.Build.props `
        src/DailyNagger.Server `
        scripts/run-vps-ef-migration.sh `
        scripts/run-vps-production-minimum-seed.sh `
        scripts/seed-production-minimum.sql
}
finally {
    Pop-Location
}

Get-Item $OutputPath | Select-Object FullName, Length
