<#
.SYNOPSIS
Builds and starts the Android development client.

.DESCRIPTION
Sets DailyNagger's Windows development paths for the current process before
calling Expo. This keeps Android, Gradle, npm, and Ninja on the E: drive even
when the shell was opened before machine environment variables were refreshed.
#>

param(
    [string]$RepoRootPath
)

$ErrorActionPreference = "Stop"

$repoRoot = if ([string]::IsNullOrWhiteSpace($RepoRootPath)) {
    (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}
else {
    (Resolve-Path $RepoRootPath).Path
}

$mobileProject = Join-Path $repoRoot "src\DailyNagger.Mobile"
$androidSdkPath = "E:\Android\Sdk"
$ninjaPath = "E:\Programs\ninja\ninja.exe"

$env:ANDROID_HOME = $androidSdkPath
$env:ANDROID_SDK_ROOT = $androidSdkPath
$env:ANDROID_AVD_HOME = "E:\Android\Avd"
$env:GRADLE_USER_HOME = "E:\Caches\gradle"
$env:NUGET_PACKAGES = "E:\Caches\nuget"
$env:DAILY_NAGGER_NINJA = $ninjaPath
$env:Path = "E:\Programs\ninja;E:\Programs\nodejs;$androidSdkPath\platform-tools;$androidSdkPath\cmdline-tools\latest\bin;$env:Path"

Push-Location $mobileProject
try {
    & npx expo run:android
    if ($LASTEXITCODE -ne 0) {
        throw "expo run:android failed with exit code $LASTEXITCODE."
    }
}
finally {
    Pop-Location
}
