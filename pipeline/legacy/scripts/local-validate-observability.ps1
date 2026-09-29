$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$serverProject = Join-Path $repoRoot "src\DailyNagger.Server\DailyNagger.Server.csproj"
$serverDll = Join-Path $repoRoot "src\DailyNagger.Server\bin\Debug\net10.0\DailyNagger.Server.dll"
$seqUrl = "http://localhost:5341"
$healthUrl = "http://localhost:5007/api/health"
$server = $null

$docker = (Get-Command docker -ErrorAction SilentlyContinue).Source
if (!$docker) {
    $docker = "C:\Program Files\Docker\Docker\resources\bin\docker.exe"
}
if (!(Test-Path $docker)) {
    throw "Docker CLI was not found."
}

try {
    Push-Location $repoRoot

    Write-Host "Starting SQL Server and Seq..."
    & $docker compose up -d sqlserver sqlserver-init seq

    Write-Host "Checking Seq..."
    $seqResponse = Invoke-WebRequest $seqUrl -UseBasicParsing
    if ($seqResponse.StatusCode -ne 200) { throw "Seq returned HTTP $($seqResponse.StatusCode)." }

    Write-Host "Building server..."
    dotnet build $serverProject

    Write-Host "Starting server..."
    $env:ASPNETCORE_ENVIRONMENT = "Development"
    $env:ASPNETCORE_URLS = "http://localhost:5007"
    $server = Start-Process dotnet -ArgumentList $serverDll `
        -WorkingDirectory (Split-Path -Parent $serverProject) `
        -PassThru `
        -WindowStyle Hidden

    $requestId = [guid]::NewGuid().ToString("D")
    $healthResponse = $null

    Write-Host "Checking health..."
    for ($attempt = 1; $attempt -le 30; $attempt++) {
        try {
            $healthResponse = Invoke-WebRequest $healthUrl `
                -Headers @{ "X-DailyNagger-Request-Id" = $requestId } `
                -UseBasicParsing
            break
        }
        catch {
            Start-Sleep -Seconds 1
        }
    }

    if (!$healthResponse) { throw "Server did not respond at $healthUrl." }
    if ($healthResponse.StatusCode -ne 200) { throw "Health returned HTTP $($healthResponse.StatusCode)." }
    if ($healthResponse.Headers["X-DailyNagger-Request-Id"] -ne $requestId) {
        throw "Health response did not echo request id."
    }

    Write-Host "Checking Seq request log..."
    $seqEvent = $null
    $seqFilter = [uri]::EscapeDataString("requestId = '$requestId'")
    $seqEventsUrl = "$seqUrl/api/events?count=20&filter=$seqFilter"

    for ($attempt = 1; $attempt -le 30; $attempt++) {
        $seqEvent = Invoke-RestMethod $seqEventsUrl | Select-Object -First 1
        if ($seqEvent) {
            break
        }

        Start-Sleep -Seconds 1
    }

    if (!$seqEvent) {
        Stop-Process -Id $server.Id
        $server.WaitForExit()
        $server = $null
        for ($attempt = 1; $attempt -le 10; $attempt++) {
            $seqEvent = Invoke-RestMethod $seqEventsUrl | Select-Object -First 1
            if ($seqEvent) {
                break
            }

            Start-Sleep -Seconds 1
        }
    }

    if (!$seqEvent) { throw "Seq did not receive request id $requestId." }

    Write-Host "Local observability validation passed."
    Write-Host "RequestId: $requestId"
    Write-Host "SeqEvent: $($seqEvent.Id)"
}
finally {
    if ($server -and !$server.HasExited) {
        Stop-Process -Id $server.Id
    }
    Pop-Location
}
