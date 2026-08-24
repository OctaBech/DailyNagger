$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

Push-Location $repoRoot
try {
    npm run contracts:generate

    $contractChanges = git status --short -- src/api-contracts

    if ($contractChanges) {
        Write-Error "API contracts are stale. Run 'npm run contracts:generate' and commit the changes."
    }

    Write-Host "API contracts are up to date."
}
finally {
    Pop-Location
}