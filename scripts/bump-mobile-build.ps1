param(
    [string]$RepoRootPath,
    [int]$VersionCode
)

$ErrorActionPreference = "Stop"

$repoRoot = if ([string]::IsNullOrWhiteSpace($RepoRootPath)) {
    (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}
else {
    (Resolve-Path $RepoRootPath).Path
}

$appConfigPath = Join-Path $repoRoot "src\DailyNagger.Mobile\app.config.ts"
$androidBuildGradlePath = Join-Path $repoRoot "src\DailyNagger.Mobile\android\app\build.gradle"

if (!(Test-Path $appConfigPath)) {
    throw "Missing Expo config: $appConfigPath"
}

$versionCodes = @()

$appConfig = Get-Content $appConfigPath -Raw
$appConfigVersionCodeMatch = [regex]::Match($appConfig, "versionCode:\s*(\d+)")
if ($appConfigVersionCodeMatch.Success) {
    $versionCodes += [int]$appConfigVersionCodeMatch.Groups[1].Value
}

$androidBuildGradle = $null
if (Test-Path $androidBuildGradlePath) {
    $androidBuildGradle = Get-Content $androidBuildGradlePath -Raw
    $gradleVersionCodeMatch = [regex]::Match($androidBuildGradle, "versionCode\s+(\d+)")
    if (!$gradleVersionCodeMatch.Success) {
        throw "Could not find Android versionCode in $androidBuildGradlePath"
    }

    $versionCodes += [int]$gradleVersionCodeMatch.Groups[1].Value
}

$currentVersionCode = if ($versionCodes.Count -gt 0) {
    ($versionCodes | Measure-Object -Maximum).Maximum
}
else {
    0
}

$nextVersionCode = if ($VersionCode -gt 0) { $VersionCode } else { $currentVersionCode + 1 }

if ($nextVersionCode -le $currentVersionCode) {
    throw "Next Android versionCode must be greater than $currentVersionCode. Requested: $nextVersionCode"
}

if ($null -ne $androidBuildGradle) {
    $androidBuildGradle = [regex]::Replace(
        $androidBuildGradle,
        "versionCode\s+\d+",
        "versionCode $nextVersionCode",
        1
    )
    [System.IO.File]::WriteAllText($androidBuildGradlePath, $androidBuildGradle)
}

if ($appConfig -match "versionCode:\s*\d+") {
    $appConfig = [regex]::Replace($appConfig, "versionCode:\s*\d+", "versionCode: $nextVersionCode", 1)
}
else {
    $appConfig = $appConfig.Replace(
        'package: "com.dailynagger.mobile",',
        "package: `"com.dailynagger.mobile`",`r`n    versionCode: $nextVersionCode,"
    )
}
[System.IO.File]::WriteAllText($appConfigPath, $appConfig)

Write-Host "DailyNagger Android versionCode: $currentVersionCode -> $nextVersionCode"
