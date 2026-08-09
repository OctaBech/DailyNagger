$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$serverProject = Join-Path $repoRoot "src\DailyNagger.Server\DailyNagger.Server.csproj"

Get-Process DailyNagger.Server -ErrorAction SilentlyContinue |
    Stop-Process -Force

dotnet run --project $serverProject --urls "http://localhost:5010"
