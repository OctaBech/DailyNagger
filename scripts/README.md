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
- `validate-local-compose.ps1` builds and starts the local Docker stack, then checks server, database, and Seq request-id logging.
- `update-api-contracts.ps1` fetches OpenAPI from a running local API and regenerates TypeScript contracts.
  - `-OpenApiUrl`: OpenAPI endpoint override, default `http://localhost:5010/openapi/v1.json`.

## Mobile

- GitHub `Mobile APK Build` builds an APK artifact from a clean runner. It is manual, short-lived, and not an app-store release.
- `build-mobile-release-apk.ps1` builds the Android release APK and installs it on a connected device.
  - `-RepoRootPath`, `-MobileProjectPath`, `-DevCacheRootPath`, `-AndroidSdkPath`: path overrides.
  - `-DeviceId`: target a specific device.
  - `-SkipInstall`: build APK only.
  - `-Notify`: play a sound when done.
- `build-mobile-ci-apk.ps1` generates the Expo Android project, builds a release APK artifact, and does not install it.
  - `-RepoRootPath`, `-MobileProjectPath`, `-ArtifactOutputPath`: path overrides.
- `start-mobile-android.ps1` sets E: drive Android/Gradle/Ninja paths, then runs `npx expo run:android`.
  - `-RepoRootPath`: repo path override.

## Server

Production deploy, backup, smoke checks, and rollback are documented in `docs/runbooks/production-deploy.md`.

- Run `use-production-secrets.ps1` once per PowerShell session before production deploy, backup, smoke, rollback inspection, or Seq scripts.
  - `-SecretsRootPath`, `-VpsHost`, `-SshKeyPath`, `-KnownHostsPath`: session setup overrides.
- `start-local-api.ps1` stops any local `DailyNagger.Server` process and starts the API on `http://localhost:5010`.
- `test-server.ps1` starts SQL Server, waits for `sqlserver-init`, then runs `dotnet test`.
  - `-RepoRootPath`: repo path override.
- `reset-local-db.ps1` drops, recreates, migrates, and seeds the local SQL Server databases.
  - `-SqlServer`, `-SqlUser`, `-SqlPassword`: SQL connection overrides.
- `deploy-server.ps1` uploads server source to the VPS, builds a tagged Docker image, migrates, restarts, and smoke-tests production.
  - `-RepoRootPath`, `-SshKeyPath`, `-VpsHost`, `-VpsUser`, `-RemotePath`, `-ImageTag`, `-KnownHostsPath`: deploy overrides.
  - `-SkipMigrations`: deploy without EF migrations.
  - `-Notify`: play a sound when done.
- `deploy-production.ps1` runs the safe production chain: backup first, deploy only if backup succeeds.
  - Same deploy connection parameters, plus `-LocalBackupRootPath`.
- `backup-production-db.ps1` backs up production SQL Server databases on the VPS and downloads them locally.
  - `-SshKeyPath`, `-VpsHost`, `-VpsUser`, `-RemotePath`, `-LocalBackupRootPath`, `-KnownHostsPath`, `-BackupStamp`: backup overrides.
- `smoke-production.ps1` runs production health, database health, and today's plan smoke checks through the VPS.
  - `-SshKeyPath`, `-VpsHost`, `-VpsUser`, `-RemotePath`, `-KnownHostsPath`: connection overrides.
- `inspect-production-rollback.ps1` shows current and previous production server image tags without changing the VPS.
  - `-SshKeyPath`, `-VpsHost`, `-VpsUser`, `-RemotePath`, `-KnownHostsPath`: connection overrides.
- `open-production-seq.ps1` opens an SSH tunnel to production Seq and opens `http://localhost:5341`.
  - `-VpsHost`, `-VpsUser`, `-SshKeyPath`, `-KnownHostsPath`, `-LocalPort`: tunnel overrides.
- `pack-server-deploy-source.ps1` creates the server source archive used by deploy.
  - `-RepoRoot`, `-OutputPath`: archive path overrides.
- `run-vps-ef-migration.sh` runs EF migrations from a .NET SDK container on the VPS.
  - Argument 1: EF `DbContext` name.
- `run-vps-production-minimum-seed.sh` applies the minimum production seed on the VPS.

## Seeds

- `seed-local-dev-data.sql` contains local development seed data.
- `seed-production-minimum.sql` contains the minimum production seed.
