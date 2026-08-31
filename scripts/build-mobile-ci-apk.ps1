<#
.SYNOPSIS
Builds a DailyNagger Android APK artifact on a clean CI runner.

.DESCRIPTION
Generates the ignored Expo Android project, builds the release APK with Gradle,
and copies the APK into an artifact folder. This script does not bump
versionCode, install on a device, or upload to an app store.

.PARAMETER RepoRootPath
Repository root. Defaults to the parent folder of this script.

.PARAMETER MobileProjectPath
Mobile project path. Defaults to src/DailyNagger.Mobile under the repo root.

.PARAMETER ArtifactOutputPath
Folder where the APK artifact should be copied.
#>

param(
    [string]$RepoRootPath,
    [string]$MobileProjectPath,
    [string]$ArtifactOutputPath
)

$ErrorActionPreference = "Stop"

function Assert-LastExitCode {
    param([string]$CommandName)

    if ($LASTEXITCODE -ne 0) {
        throw "$CommandName failed with exit code $LASTEXITCODE."
    }
}

function Get-EnvOrDefault {
    param(
        [string]$Name,
        [string]$DefaultValue
    )

    $value = [Environment]::GetEnvironmentVariable($Name)
    if ([string]::IsNullOrWhiteSpace($value)) {
        return $DefaultValue
    }

    return $value
}

$repoRoot = if ([string]::IsNullOrWhiteSpace($RepoRootPath)) {
    (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}
else {
    (Resolve-Path $RepoRootPath).Path
}

$mobileProject = if ([string]::IsNullOrWhiteSpace($MobileProjectPath)) {
    (Resolve-Path (Join-Path $repoRoot "src/DailyNagger.Mobile")).Path
}
else {
    (Resolve-Path $MobileProjectPath).Path
}

$artifactOutput = if ([string]::IsNullOrWhiteSpace($ArtifactOutputPath)) {
    Join-Path $repoRoot "artifacts/mobile-apk"
}
else {
    $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($ArtifactOutputPath)
}

$apiBaseUrl = Get-EnvOrDefault `
    -Name "EXPO_PUBLIC_DAILY_NAGGER_API_BASE_URL" `
    -DefaultValue "https://dailynagger.46-225-130-77.sslip.io"
$apiToken = Get-EnvOrDefault -Name "EXPO_PUBLIC_DAILY_NAGGER_API_TOKEN" -DefaultValue "ci-apk-placeholder-token"
$communityId = Get-EnvOrDefault `
    -Name "EXPO_PUBLIC_DAILY_NAGGER_COMMUNITY_ID" `
    -DefaultValue "22222222-2222-2222-2222-222222222222"
$userId = Get-EnvOrDefault `
    -Name "EXPO_PUBLIC_DAILY_NAGGER_USER_ID" `
    -DefaultValue "11111111-1111-1111-1111-111111111111"
$whyDidYouRender = Get-EnvOrDefault -Name "EXPO_PUBLIC_DAILY_NAGGER_WHY_DID_YOU_RENDER" -DefaultValue "false"
$sentryDsn = Get-EnvOrDefault -Name "EXPO_PUBLIC_SENTRY_DSN" -DefaultValue ""

if (!$apiBaseUrl.StartsWith("https://")) {
    throw "CI APK build refused: API base URL must use HTTPS: $apiBaseUrl"
}

Write-Host "Building DailyNagger mobile APK artifact..."
Write-Host "Repo root: $repoRoot"
Write-Host "Mobile project: $mobileProject"
Write-Host "Artifact output: $artifactOutput"
Write-Host "API base URL: $apiBaseUrl"
Write-Host "API token: configured"

Push-Location $mobileProject
try {
    $env:CI = "1"
    $env:SENTRY_DISABLE_AUTO_UPLOAD = "true"
    $env:EXPO_PUBLIC_DAILY_NAGGER_API_BASE_URL = $apiBaseUrl
    $env:EXPO_PUBLIC_DAILY_NAGGER_API_TOKEN = $apiToken
    $env:EXPO_PUBLIC_DAILY_NAGGER_COMMUNITY_ID = $communityId
    $env:EXPO_PUBLIC_DAILY_NAGGER_USER_ID = $userId
    $env:EXPO_PUBLIC_DAILY_NAGGER_WHY_DID_YOU_RENDER = $whyDidYouRender
    $env:EXPO_PUBLIC_SENTRY_DSN = $sentryDsn

    npm ci
    Assert-LastExitCode "npm ci"

    $env:NODE_ENV = "production"

    npx expo prebuild --platform android --clean
    Assert-LastExitCode "expo prebuild"

    $isWindowsHost = [System.Environment]::OSVersion.Platform -eq "Win32NT"
    $gradle = if ($isWindowsHost) {
        Join-Path $mobileProject "android/gradlew.bat"
    }
    else {
        Join-Path $mobileProject "android/gradlew"
    }

    & $gradle -p (Join-Path $mobileProject "android") assembleRelease --stacktrace
    Assert-LastExitCode "gradle assembleRelease"

    $apkOutputPath = Join-Path $mobileProject "android/app/build/outputs/apk/release"
    $apk = Get-ChildItem $apkOutputPath -Filter "*.apk" |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1

    if ($null -eq $apk) {
        throw "Release APK was not found in $apkOutputPath."
    }

    New-Item -ItemType Directory -Force -Path $artifactOutput | Out-Null

    $artifactStamp = [Environment]::GetEnvironmentVariable("GITHUB_SHA")
    if ([string]::IsNullOrWhiteSpace($artifactStamp)) {
        $artifactStamp = "local"
    }

    $artifactName = "DailyNagger-$artifactStamp.apk"
    $artifactPath = Join-Path $artifactOutput $artifactName
    Copy-Item -LiteralPath $apk.FullName -Destination $artifactPath -Force

    Write-Host "APK artifact:"
    Get-Item $artifactPath | Select-Object FullName, Length, LastWriteTime
}
finally {
    Pop-Location
}
