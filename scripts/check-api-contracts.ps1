$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$schemaPath = Join-Path $repoRoot "src\api-contracts\src\schema.ts"

function Get-Sha256Hash {
    param([string]$Path)

    if (!(Test-Path $Path)) {
        return ""
    }

    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    try {
        $stream = [System.IO.File]::OpenRead($Path)
        try {
            return [BitConverter]::ToString($sha256.ComputeHash($stream)).Replace("-", "")
        }
        finally {
            $stream.Dispose()
        }
    }
    finally {
        $sha256.Dispose()
    }
}

Push-Location $repoRoot
try {
    $beforeHash = Get-Sha256Hash $schemaPath

    npm run contracts:generate

    $afterHash = Get-Sha256Hash $schemaPath

    if ($beforeHash -ne $afterHash) {
        Write-Error "API contracts are stale. Run 'npm run contracts:generate' and commit the changes."
    }

    Write-Host "API contracts are up to date."
}
finally {
    Pop-Location
}
