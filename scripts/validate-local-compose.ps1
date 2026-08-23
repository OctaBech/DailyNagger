$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$seqUrl = "http://localhost:5341"
$healthUrl = "http://localhost:5007/api/health"
$databaseHealthUrl = "http://localhost:5007/api/health/database"

$docker = (Get-Command docker -ErrorAction SilentlyContinue).Source
if (!$docker) {
    $docker = "C:\Program Files\Docker\Docker\resources\bin\docker.exe"
}
if (!(Test-Path $docker)) {
    throw "Docker CLI was not found."
}

function Invoke-HealthCheck {
    param(
        [string]$Url,
        [string]$RequestId
    )

    Invoke-WebRequest $Url `
        -Headers @{ "X-DailyNagger-Request-Id" = $RequestId } `
        -UseBasicParsing
}

try {
    Push-Location $repoRoot

    Write-Host "Starting local Docker stack..."
    & $docker compose up -d --build server

    Write-Host "Checking server health..."
    $requestId = [guid]::NewGuid().ToString("D")
    $healthResponse = $null

    for ($attempt = 1; $attempt -le 45; $attempt++) {
        try {
            $healthResponse = Invoke-HealthCheck -Url $healthUrl -RequestId $requestId
            break
        }
        catch {
            Start-Sleep -Seconds 1
        }
    }

    if (!$healthResponse) {
        throw "Server did not respond at $healthUrl."
    }
    if ($healthResponse.StatusCode -ne 200) {
        throw "Health returned HTTP $($healthResponse.StatusCode)."
    }
    if ($healthResponse.Headers["X-DailyNagger-Request-Id"] -ne $requestId) {
        throw "Health response did not echo request id."
    }

    Write-Host "Checking database health..."
    $databaseRequestId = [guid]::NewGuid().ToString("D")
    $databaseHealthResponse = Invoke-HealthCheck -Url $databaseHealthUrl -RequestId $databaseRequestId
    if ($databaseHealthResponse.StatusCode -ne 200) {
        throw "Database health returned HTTP $($databaseHealthResponse.StatusCode)."
    }

    Write-Host "Checking Seq request log..."
    $seqFilter = [uri]::EscapeDataString("requestId = '$requestId'")
    $seqEventsUrl = "$seqUrl/api/events?count=20&filter=$seqFilter"
    $seqEvent = $null

    for ($attempt = 1; $attempt -le 30; $attempt++) {
        $seqEvent = Invoke-RestMethod $seqEventsUrl | Select-Object -First 1
        if ($seqEvent) {
            break
        }

        Start-Sleep -Seconds 1
    }

    if (!$seqEvent) {
        throw "Seq did not receive request id $requestId."
    }

    Write-Host "Local Docker stack validation passed."
    Write-Host "RequestId: $requestId"
    Write-Host "SeqEvent: $($seqEvent.Id)"
}
finally {
    Pop-Location
}
