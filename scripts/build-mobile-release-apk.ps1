param(
    [string]$RepoRootPath,
    [string]$MobileProjectPath,
    [string]$DevCacheRootPath = "E:\Caches",
    [string]$AndroidSdkPath,
    [string]$DeviceId,
    [switch]$SkipInstall,
    [switch]$Notify
)

$ErrorActionPreference = "Stop"

function Assert-LastExitCode {
    param([string]$CommandName)

    if ($LASTEXITCODE -ne 0) {
        throw "$CommandName failed with exit code $LASTEXITCODE."
    }
}

function Invoke-BuildNotification {
    param([bool]$Succeeded)

    if (!$Notify) {
        return
    }

    if ($Succeeded) {
        [System.Media.SystemSounds]::Asterisk.Play()
        Start-Sleep -Milliseconds 180
        [System.Media.SystemSounds]::Asterisk.Play()
        return
    }

    [System.Media.SystemSounds]::Hand.Play()
}

function Import-DotEnv {
    param([string]$Path)

    Get-Content $Path |
        Where-Object { $_ -match "^\s*[^#][^=]+=" } |
        ForEach-Object {
            $name, $value = $_ -split "=", 2
            $name = $name.Trim()
            $value = $value.Trim()

            if (
                ($value.StartsWith('"') -and $value.EndsWith('"')) -or
                ($value.StartsWith("'") -and $value.EndsWith("'"))
            ) {
                $value = $value.Substring(1, $value.Length - 2)
            }

            Set-Item -Path "Env:$name" -Value $value
        }
}

function Get-RequiredEnv {
    param([string]$Name)

    $value = [Environment]::GetEnvironmentVariable($Name)
    if ([string]::IsNullOrWhiteSpace($value)) {
        throw "Missing required environment value: $Name."
    }

    return $value
}

function Get-AndroidSdkPath {
    param([string]$ConfiguredPath)

    if (![string]::IsNullOrWhiteSpace($ConfiguredPath)) {
        return $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($ConfiguredPath)
    }

    $androidHome = [Environment]::GetEnvironmentVariable("ANDROID_HOME")
    if (![string]::IsNullOrWhiteSpace($androidHome)) {
        return $androidHome
    }

    $androidSdkRoot = [Environment]::GetEnvironmentVariable("ANDROID_SDK_ROOT")
    if (![string]::IsNullOrWhiteSpace($androidSdkRoot)) {
        return $androidSdkRoot
    }

    throw "Missing Android SDK path. Set ANDROID_HOME, ANDROID_SDK_ROOT, or pass -AndroidSdkPath <path>."
}

function Get-AdbDeviceIds {
    $devices = & adb devices
    Assert-LastExitCode "adb devices"

    return $devices |
        Select-String -Pattern "^\S+\s+device$" |
        ForEach-Object { ($_ -split "\s+")[0] }
}

function Remove-DirectoryInside {
    param(
        [string]$ParentPath,
        [string]$ChildRelativePath
    )

    $parent = (Resolve-Path $ParentPath).Path
    $target = Join-Path $parent $ChildRelativePath

    if (!(Test-Path $target)) {
        return
    }

    $resolvedTarget = (Resolve-Path $target).Path
    if (!$resolvedTarget.StartsWith($parent, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to remove path outside parent. Parent: $parent Target: $resolvedTarget"
    }

    Remove-Item -LiteralPath $resolvedTarget -Recurse -Force
}

function Clear-KnownDirtyCMakeCache {
    param([string]$MobileProject)

    Write-Host "Cleaning stale expo-modules-core CMake cache..."
    Remove-DirectoryInside `
        -ParentPath $MobileProject `
        -ChildRelativePath "node_modules\expo\node_modules\expo-modules-core\android\.cxx"

    Remove-DirectoryInside `
        -ParentPath $MobileProject `
        -ChildRelativePath "node_modules\expo\node_modules\expo-modules-core\android\build"
}

function Clear-AndroidGeneratedBuildState {
    param([string]$MobileProject)

    Write-Host "Cleaning generated Android build state with stale absolute paths..."

    Remove-DirectoryInside `
        -ParentPath $MobileProject `
        -ChildRelativePath "android\.gradle"

    Remove-DirectoryInside `
        -ParentPath $MobileProject `
        -ChildRelativePath "android\.kotlin"

    Remove-DirectoryInside `
        -ParentPath $MobileProject `
        -ChildRelativePath "android\build"

    Remove-DirectoryInside `
        -ParentPath $MobileProject `
        -ChildRelativePath "android\app\.cxx"

    Remove-DirectoryInside `
        -ParentPath $MobileProject `
        -ChildRelativePath "android\app\build"
}

function Get-InstalledAndroidCMakeVersion {
    param([string]$AndroidSdk)

    $cmakeRoot = Join-Path $AndroidSdk "cmake"
    if (!(Test-Path $cmakeRoot)) {
        throw "Android SDK CMake directory does not exist: $cmakeRoot"
    }

    $cmakeVersion = Get-ChildItem $cmakeRoot -Directory |
        Where-Object { Test-Path (Join-Path $_.FullName "bin\cmake.exe") } |
        Sort-Object { [version]$_.Name } -Descending |
        Select-Object -First 1

    if ($null -eq $cmakeVersion) {
        throw "No Android SDK CMake installation found under $cmakeRoot."
    }

    return $cmakeVersion.Name
}

function Ensure-ExpoModulesCoreCMakeVersion {
    param(
        [string]$MobileProject,
        [string]$CMakeVersion
    )

    $buildGradlePath = Join-Path $MobileProject "node_modules\expo\node_modules\expo-modules-core\android\build.gradle"
    if (!(Test-Path $buildGradlePath)) {
        throw "Missing expo-modules-core Gradle file at $buildGradlePath. Run npm install before release building."
    }

    $buildGradle = Get-Content $buildGradlePath -Raw
    if ($buildGradle -match "version\s+`"$([regex]::Escape($CMakeVersion))`"") {
        return $false
    }

    if ($buildGradle -match 'version\s+"[^"]+"') {
        Write-Host "Pinning expo-modules-core to Android SDK CMake $CMakeVersion..."
        $buildGradle -replace 'version\s+"[^"]+"', "version `"$CMakeVersion`"" |
            Set-Content -Path $buildGradlePath -NoNewline

        return $true
    }

    $needle = @'
  externalNativeBuild {
    cmake {
      path "CMakeLists.txt"
    }
  }
'@

    $replacement = @'
  externalNativeBuild {
    cmake {
      path "CMakeLists.txt"
      version "__CMAKE_VERSION__"
    }
  }
'@

    if (!$buildGradle.Contains($needle)) {
        throw "Could not patch expo-modules-core CMake version. Expected Gradle block was not found."
    }

    Write-Host "Pinning expo-modules-core to Android SDK CMake $CMakeVersion..."
    $buildGradle.Replace($needle, $replacement.Replace("__CMAKE_VERSION__", $CMakeVersion)) |
        Set-Content -Path $buildGradlePath -NoNewline

    return $true
}

function Ensure-ReactNativeGradlePluginFoojayVersion {
    param([string]$MobileProject)

    $settingsGradlePath = Join-Path $MobileProject "node_modules\@react-native\gradle-plugin\settings.gradle.kts"
    if (!(Test-Path $settingsGradlePath)) {
        throw "Missing React Native Gradle plugin settings file at $settingsGradlePath. Run npm install before release building."
    }

    $settingsGradle = Get-Content $settingsGradlePath -Raw
    if ($settingsGradle -match 'foojay-resolver-convention"\)\.version\("1\.0\.0"\)') {
        return $false
    }

    $oldPluginLine = 'plugins { id("org.gradle.toolchains.foojay-resolver-convention").version("0.5.0") }'
    $newPluginLine = 'plugins { id("org.gradle.toolchains.foojay-resolver-convention").version("1.0.0") }'

    if (!$settingsGradle.Contains($oldPluginLine)) {
        throw "Could not patch React Native Gradle plugin Foojay resolver version. Expected plugin line was not found."
    }

    Write-Host "Pinning React Native Gradle plugin Foojay resolver to 1.0.0 for Gradle 9 compatibility..."
    $settingsGradle.Replace($oldPluginLine, $newPluginLine) |
        Set-Content -Path $settingsGradlePath -NoNewline

    return $true
}

function Invoke-GradleReleaseBuild {
    param(
        [string]$MobileProject,
        [string]$GradlePath,
        [string]$GradleUserHome,
        [string]$BuildLogPath
    )

    Push-Location $MobileProject
    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"

    try {
        & $GradlePath `
            --gradle-user-home $GradleUserHome `
            -p (Join-Path $MobileProject "android") `
            assembleRelease `
            --stacktrace 2>&1 |
            ForEach-Object { "$_" } |
            ForEach-Object {
                Add-Content -Path $BuildLogPath -Value $_
                Write-Host $_
            }

        return $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
        Pop-Location
    }
}

try {
$repoRoot = if ([string]::IsNullOrWhiteSpace($RepoRootPath)) {
    (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}
else {
    (Resolve-Path $RepoRootPath).Path
}

$mobileProject = if ([string]::IsNullOrWhiteSpace($MobileProjectPath)) {
    (Resolve-Path (Join-Path $repoRoot "src\DailyNagger.Mobile")).Path
}
else {
    (Resolve-Path $MobileProjectPath).Path
}

$buildLogDirectory = Join-Path $repoRoot "artifacts\mobile-builds"
$buildLogPath = Join-Path $buildLogDirectory "release-apk-build.log"
$envPath = Join-Path $mobileProject ".env"
$gradlePath = Join-Path $mobileProject "android\gradlew.bat"
$apkOutputPath = Join-Path $mobileProject "android\app\build\outputs\apk\release"
$devCacheRoot = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($DevCacheRootPath)
$gradleUserHome = Join-Path $devCacheRoot "gradle"
$buildTempPath = Join-Path $devCacheRoot "temp\mobile-release-apk"
$androidSdk = Get-AndroidSdkPath $AndroidSdkPath
$androidCMakeVersion = Get-InstalledAndroidCMakeVersion $androidSdk

$mobileProjectDrive = [System.IO.Path]::GetPathRoot($mobileProject)
$androidSdkDrive = [System.IO.Path]::GetPathRoot($androidSdk)
$substDrives = @(subst)
if ($substDrives | Where-Object { $_.StartsWith("$mobileProjectDrive =>", [StringComparison]::OrdinalIgnoreCase) }) {
    Write-Warning "Mobile project is on a subst drive. React Native codegen can fail if Gradle sees both the subst path and the real path."
}

if ($androidSdkDrive.Equals("C:\", [StringComparison]::OrdinalIgnoreCase)) {
    Write-Warning "Android SDK is still on C:. Pass -AndroidSdkPath after migrating the SDK to E:."
}

if (!(Test-Path $envPath)) {
    throw "Missing mobile .env file at $envPath."
}

if (!(Test-Path $gradlePath)) {
    throw "Missing Gradle wrapper at $gradlePath. Run the Android project setup before release building."
}

Import-DotEnv $envPath

$apiBaseUrl = Get-RequiredEnv "EXPO_PUBLIC_DAILY_NAGGER_API_BASE_URL"
$apiToken = Get-RequiredEnv "EXPO_PUBLIC_DAILY_NAGGER_API_TOKEN"
$env:NODE_ENV = "production"
$env:GRADLE_USER_HOME = $gradleUserHome
$env:ANDROID_HOME = $androidSdk
$env:ANDROID_SDK_ROOT = $androidSdk
$env:TEMP = $buildTempPath
$env:TMP = $buildTempPath

if (
    [string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable("SENTRY_AUTH_TOKEN")) -or
    [string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable("SENTRY_ORG")) -or
    [string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable("SENTRY_PROJECT"))
) {
    Write-Host "Sentry upload credentials are not fully configured. Disabling source map upload for this local APK build."
    $env:SENTRY_DISABLE_AUTO_UPLOAD = "true"
}

if ($apiBaseUrl -match "localhost|127\.0\.0\.1") {
    throw "Release build refused: API base URL points to local machine: $apiBaseUrl"
}

if (!$apiBaseUrl.StartsWith("https://")) {
    throw "Release build refused: API base URL must use HTTPS: $apiBaseUrl"
}

Write-Host "Building DailyNagger mobile release APK..."
Write-Host "Repo root: $repoRoot"
Write-Host "Mobile project: $mobileProject"
Write-Host "API base URL: $apiBaseUrl"
Write-Host "API token: configured"
Write-Host "Build log: $buildLogPath"
Write-Host "Gradle user home: $gradleUserHome"
Write-Host "Android SDK: $androidSdk"
Write-Host "Android SDK CMake: $androidCMakeVersion"
Write-Host "Build temp: $buildTempPath"

New-Item -ItemType Directory -Force -Path $buildLogDirectory | Out-Null
New-Item -ItemType Directory -Force -Path $gradleUserHome | Out-Null
New-Item -ItemType Directory -Force -Path $buildTempPath | Out-Null
if (!(Test-Path $androidSdk)) {
    throw "Android SDK path does not exist: $androidSdk"
}
Remove-Item $buildLogPath -ErrorAction SilentlyContinue

& (Join-Path $PSScriptRoot "bump-mobile-build.ps1") -RepoRootPath $repoRoot

$patchedExpoModulesCore = Ensure-ExpoModulesCoreCMakeVersion $mobileProject $androidCMakeVersion
if ($patchedExpoModulesCore) {
    Clear-KnownDirtyCMakeCache $mobileProject
}

$patchedReactNativeFoojay = Ensure-ReactNativeGradlePluginFoojayVersion $mobileProject

$buildExitCode = Invoke-GradleReleaseBuild `
    -MobileProject $mobileProject `
    -GradlePath $gradlePath `
    -GradleUserHome $gradleUserHome `
    -BuildLogPath $buildLogPath

if ($buildExitCode -ne 0) {
    $buildLog = Get-Content $buildLogPath -Raw

    if ($buildLog -match "build\.ninja' still dirty") {
        Clear-KnownDirtyCMakeCache $mobileProject
        Remove-Item $buildLogPath -ErrorAction SilentlyContinue

        $buildExitCode = Invoke-GradleReleaseBuild `
            -MobileProject $mobileProject `
            -GradlePath $gradlePath `
            -GradleUserHome $gradleUserHome `
            -BuildLogPath $buildLogPath

        if ($buildExitCode -ne 0) {
            $buildLog = Get-Content $buildLogPath -Raw
        }
    }

    if ($buildExitCode -ne 0 -and $buildLog -match "different roots") {
        Clear-AndroidGeneratedBuildState $mobileProject
        Remove-Item $buildLogPath -ErrorAction SilentlyContinue

        $buildExitCode = Invoke-GradleReleaseBuild `
            -MobileProject $mobileProject `
            -GradlePath $gradlePath `
            -GradleUserHome $gradleUserHome `
            -BuildLogPath $buildLogPath
    }
}

if ($buildExitCode -ne 0) {
    Write-Host "Gradle build log: $buildLogPath"
    throw "gradlew assembleRelease failed with exit code $buildExitCode."
}

$apk = Get-ChildItem $apkOutputPath -Filter "*.apk" |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

if ($null -eq $apk) {
    throw "Release APK was not found in $apkOutputPath."
}

Write-Host "Release APK:"
$apk | Select-Object FullName, Length, LastWriteTime

if ($SkipInstall) {
    Invoke-BuildNotification $true
    return
}

$devices = @(Get-AdbDeviceIds)

if ([string]::IsNullOrWhiteSpace($DeviceId)) {
    if ($devices.Count -eq 0) {
        throw "No Android device is connected. Connect the phone and run adb devices."
    }

    if ($devices.Count -gt 1) {
        throw "More than one Android device is connected. Re-run with -DeviceId <id>. Devices: $($devices -join ', ')"
    }

    $DeviceId = $devices[0]
}
elseif ($devices -notcontains $DeviceId) {
    throw "Android device '$DeviceId' was not found. Connected devices: $($devices -join ', ')"
}

Write-Host "Installing APK on Android device: $DeviceId"
& adb -s $DeviceId install -r $apk.FullName
Assert-LastExitCode "adb install"

Write-Host "DailyNagger release APK installed."
Invoke-BuildNotification $true
}
catch {
    Invoke-BuildNotification $false
    throw
}
