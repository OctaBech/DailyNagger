# Development Environment

DailyNagger is developed on a dedicated `E:` drive named `DailyNagger`.

The goal is not to make Windows perfectly clean. Installers, registry entries,
and small profile files will still touch `C:`. The goal is that project-owned
source, secrets, generated caches, Docker data, local databases, and emulator
state have clear homes and are easy to recreate.

## Drive Layout

```text
E:\DailyNagger\
E:\Programs\
E:\Secrets\
E:\Caches\
E:\Docker\
E:\Data\
E:\Rescue\
E:\Android\Sdk\
E:\Android\Avd\
```

`E:\DailyNagger\` is the repository workspace.

`E:\Programs\` is for development tools that allow a custom install location.

`E:\Secrets\` is for local secret files. It is not a repository folder and must
never be committed.

`E:\Caches\` is for heavy generated caches where tools support relocation, for
example npm, NuGet, and Gradle.

`E:\Android\Sdk\` and `E:\Android\Avd\` are for Android SDK packages and
emulators.

`E:\Docker\` is for Docker Desktop's disk image. Docker-owned volumes such as
SQL Server and Seq data live inside that disk image.

`E:\Data\` is for explicit project data exports, backups, and generated data
that should be visible directly from Windows.

`E:\Rescue\` is temporary rescue storage while rebuilding the machine. It is not
part of the normal development workflow.

## Scripted Setup

Run this from the repository root after installing the required system tools:

```powershell
.\scripts\configure-dev-machine.ps1
```

The script creates the expected folders, sets cache environment variables, sets
the npm cache, and adds Android SDK tools to the user PATH without using
`setx PATH`.

The script does not install Git, Node.js, .NET, Java, Android Studio, Docker, or
Visual Studio.

Then validate the machine:

```powershell
.\scripts\validate-dev-machine.ps1
```

Use this shorter check while tools are still being installed:

```powershell
.\scripts\validate-dev-machine.ps1 -SkipProjectChecks
```

The split is intentional:

- `configure-dev-machine.ps1` writes machine settings.
- `bootstrap-dev.ps1` restores a checkout.
- `validate-dev-machine.ps1` proves the machine and checkout can actually run.

## Tool Setup

These are the settings used when rebuilding the DailyNagger machine.

### Git

Install Git for Windows.

Installer choices:

- keep Windows Explorer integration
- keep Git LFS
- add Git to PATH from the command line and third-party software
- use Windows Secure Channel for HTTPS
- use checkout as-is, commit Unix-style line endings
- use Git Credential Manager
- enable file system caching
- do not enable symbolic links unless the project starts needing them

Post-install configuration:

```powershell
git config --global init.defaultBranch main
git config --global pull.ff only
git config --global core.autocrlf input
git config --global user.name "Martin Bech"
git config --global user.email "MartinJBech@live.com"
```

Validation:

```powershell
git --version
git config --global --list
```

### Node.js And npm

Install Node.js with npm and add it to PATH.

Then move the npm cache to `E:`:

```powershell
npm config set cache E:\Caches\npm --global
npm config get cache
```

Expected cache:

```text
E:\Caches\npm
```

### .NET And NuGet

Install the .NET SDK required by `global.json`.

Then move NuGet packages to `E:`:

```powershell
setx NUGET_PACKAGES E:\Caches\nuget
```

Open a new terminal and validate:

```powershell
dotnet --version
dotnet --list-sdks
$env:NUGET_PACKAGES
```

### Java

Install Eclipse Temurin JDK 17.

Preferred install location:

```text
E:\Programs\Java\temurin-17\
```

Installer choices:

- modify PATH
- set or override `JAVA_HOME`
- `.jar` association is optional
- JavaSoft registry keys are not needed for DailyNagger

Validation:

```powershell
java -version
javac -version
$env:JAVA_HOME
```

### Android Studio And Android SDK

Install Android Studio under `E:\Programs` if the installer allows it.

Android SDK location:

```text
E:\Android\Sdk
```

Android emulator location:

```text
E:\Android\Avd
```

Required user environment variables:

```powershell
ANDROID_HOME=E:\Android\Sdk
ANDROID_SDK_ROOT=E:\Android\Sdk
ANDROID_AVD_HOME=E:\Android\Avd
GRADLE_USER_HOME=E:\Caches\gradle
```

In Android Studio, open:

```text
Settings > Languages & Frameworks > Android SDK
```

Install these SDK tools:

- Android SDK Platform-Tools
- Android SDK Build-Tools
- Android SDK Command-line Tools (latest)
- Android Emulator

Install an Android SDK platform. Prefer the current stable platform Android
Studio recommends.

Add these user PATH entries without using `setx PATH`:

```text
E:\Android\Sdk\platform-tools
E:\Android\Sdk\cmdline-tools\latest\bin
```

Validation from a new terminal:

```powershell
adb version
sdkmanager --version
```

`sdkmanager` may warn that the Android CLI is replacing it. That is acceptable
for now as long as the command resolves and reports a version.

### Mobile Project

From the mobile project:

```powershell
cd E:\DailyNagger\src\DailyNagger.Mobile
npm install
npm approve-scripts "@sentry/cli"
npm approve-scripts "unrs-resolver"
npm approve-scripts --allow-scripts-pending
npm run typecheck
npx expo-doctor
```

Known acceptable `expo-doctor` warning:

- Expo SDK 56 uses a Hermes V1 version affected by a memory regression.

Do not upgrade to Expo SDK 57 as part of machine setup. Treat that as a normal
project upgrade.

### Server Project

From the repo root:

```powershell
dotnet restore
dotnet build
npm run server:test
```

`npm run server:test` starts the Docker SQL Server dependency, waits for
`sqlserver-init`, and then runs `dotnet test`.

### Visual Studio

Enable code cleanup on save for C# files.

Project-level editor settings should live in `.vscode/settings.json` when they
are repo-wide and non-secret. Personal Visual Studio settings remain local.

### Docker, SQL Server, And Seq

Docker Desktop should use project-owned storage under `E:\Docker`.

Docker Desktop setting:

```text
Settings > Resources > Advanced > Disk image location
E:\Docker\DockerDesktopWSL
```

SQL Server and Seq run as Docker-backed local services rather than as ad hoc
local machine installs.

The local Seq container deliberately runs without authentication. It is a
developer-only service bound to the local machine.

Server logs are written to Seq through the normal Serilog sink. When the server
runs directly on Windows, Seq is reached at `http://localhost:5341`. When the
server runs inside Docker Compose, Seq is reached at `http://seq`.

Start the local service stack from the repository root:

```powershell
docker compose up -d seq sqlserver sqlserver-init
```

Validate the full local Docker stack, including the API container:

```powershell
.\scripts\validate-local-compose.ps1
```

Validate Docker:

```powershell
docker --version
docker compose version
docker info --format "{{.DockerRootDir}}"
docker compose ps
```

`docker info` reports Docker's internal Linux path, usually `/var/lib/docker`.
That is expected. The important Windows location is Docker Desktop's disk image
location under `E:\Docker`.

This area is not finished until compose, storage paths, and smoke checks are
documented.

## What Still Touches C:

Some tools still place files under `C:` because Windows and installers work that
way. That is acceptable when the files are small or tool-owned.

Expected examples:

- Windows registry entries
- Start menu shortcuts
- Visual Studio installer state
- Git Credential Manager state
- parts of WSL/Windows optional components
- small IDE profile files

Heavy project-owned state should move to `E:` whenever the tool gives us a real
setting for it.

## Rules

- `C:` is the OS drive, not the development workspace.
- Secrets live outside the repo. The repo contains examples, not real values.
- Generated artifacts and caches must be either reproducible or explicitly
  documented.
- Docker-based local services are preferred for SQL Server and Seq.
- Database files should stay in Docker volumes. Do not bind-mount SQL Server
  database files into ordinary Windows folders unless there is a specific,
  tested reason.
- Setup scripts should make the environment boring to recreate.
- Cleanup scripts may remove generated state, but only when the paths are
  explicit and inside the development drive.
