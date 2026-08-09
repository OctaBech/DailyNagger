param(
    [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")),
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
        --exclude=src/DailyNagger.Mobile/node_modules `
        --exclude=src/DailyNagger.Client/node_modules `
        -czf $OutputPath `
        global.json `
        Directory.Build.props `
        src/DailyNagger.Server
}
finally {
    Pop-Location
}

Get-Item $OutputPath | Select-Object FullName, Length
