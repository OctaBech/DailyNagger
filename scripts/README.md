# Scripts

Repeatable project commands live here. Keep scripts narrow and keep this file as a quick index.

## Development

- `configure-dev-machine.ps1` creates expected `E:` folders and points npm, NuGet, Gradle, Android SDK, AVD, and PATH there.
  - `-DevelopmentDrive`: drive root to configure, default `E:`.
- `validate-dev-machine.ps1` checks required tools, environment variables, caches, SDK paths, and basic project checks.
  - `-RepoRootPath`: repo path override.
  - `-SkipProjectChecks`: skip build/typecheck-style project validation.
- `bootstrap-dev.ps1` restores a fresh checkout into a usable local development state.
  - `-RepoRootPath`: repo path override.
  - `-SkipMobileInstall`: skip mobile `npm install`.
  - `-StartDocker`: start local Docker services.
  - `-RunChecks`: run validation after setup.
  - `-Notify`: play a sound when done.
- `validate-local-observability.ps1` checks local SQL Server, Seq, server health, and request-id logging.

## Mobile

- `build-mobile-release-apk.ps1` builds the Android release APK and installs it on a connected device.
  - `-RepoRootPath`, `-MobileProjectPath`, `-DevCacheRootPath`, `-AndroidSdkPath`: path overrides.
  - `-DeviceId`: target a specific device.
  - `-SkipInstall`: build APK only.
  - `-Notify`: play a sound when done.

## Server

- `start-local-api.ps1` stops any local `DailyNagger.Server` process and starts the API on `http://localhost:5010`.
- `reset-local-db.ps1` drops, recreates, migrates, and seeds the local SQL Server databases.
  - `-SqlServer`, `-SqlUser`, `-SqlPassword`: SQL connection overrides.
- `deploy-server.ps1` uploads server source to the VPS, builds a tagged Docker image, migrates, restarts, and smoke-tests production.
  - `-RepoRootPath`, `-SshKeyPath`, `-VpsHost`, `-VpsUser`, `-RemotePath`, `-ImageTag`: deploy overrides.
  - `-SkipMigrations`: deploy without EF migrations.
  - `-Notify`: play a sound when done.
- `pack-server-deploy-source.ps1` creates the server source archive used by deploy.
  - `-RepoRoot`, `-OutputPath`: archive path overrides.
- `run-vps-ef-migration.sh` runs EF migrations from a .NET SDK container on the VPS.
  - Argument 1: EF `DbContext` name.
- `run-vps-production-minimum-seed.sh` applies the minimum production seed on the VPS.

## Seeds

- `seed-local-dev-data.sql` contains local development seed data.
- `seed-production-minimum.sql` contains the minimum production seed.
