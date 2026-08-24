param(
    [string]$OpenApiUrl = "http://localhost:5010/openapi/v1.json"
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$openApiPath = Join-Path $repoRoot "src\api-contracts\openapi.json"

Push-Location $repoRoot
try {
    $response = Invoke-WebRequest `
        -Uri $OpenApiUrl `
        -Headers @{ "X-DailyNagger-Request-Id" = [guid]::NewGuid().ToString() } `
        -UseBasicParsing

    Set-Content -Path $openApiPath -Value $response.Content -NoNewline

    npm run contracts:generate
}
finally {
    Pop-Location
}
