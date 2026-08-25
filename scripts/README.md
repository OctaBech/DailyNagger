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

- `build-mobile-release-apk.ps1` builds the Android release APK and installs it on a connected device.
  - `-RepoRootPath`, `-MobileProjectPath`, `-DevCacheRootPath`, `-AndroidSdkPath`: path overrides.
  - `-DeviceId`: target a specific device.
  - `-SkipInstall`: build APK only.
  - `-Notify`: play a sound when done.
- `start-mobile-android.ps1` sets E: drive Android/Gradle/Ninja paths, then runs `npx expo run:android`.
  - `-RepoRootPath`: repo path override.

## Server

GitHub production workflows require these `production` environment secrets:
`DAILY_NAGGER_DEPLOY_HOST`, `DAILY_NAGGER_DEPLOY_SSH_PRIVATE_KEY`, and
`DAILY_NAGGER_DEPLOY_KNOWN_HOSTS`.

Production deploy chain:

1. `deploy-production.ps1` backs up both production databases first.
2. `deploy-server.ps1` packages server source, uploads it to `/opt/dailynagger`, and builds a tagged Docker image on the VPS.
3. EF migrations run unless `-SkipMigrations` is set.
4. `server` and `reverse-proxy` containers restart.
5. Production smoke checks verify health, database health, and today's plan.

Manual production rollback:

1. Identify the previous stable image tag from VPS `.env.backup-server-*` files or `docker image ls dailynagger-server`.
2. On the VPS, edit `/opt/dailynagger/.env` and set `DAILY_NAGGER_IMAGE_TAG` to that stable tag.
3. From `/opt/dailynagger`, run `docker compose -f compose.prod.yaml up -d server reverse-proxy`.
4. Run `docker compose -f compose.prod.yaml ps` and `docker compose -f compose.prod.yaml logs --tail=80 server`.
5. Run production smoke checks before declaring rollback complete.

Database backups are for catastrophic recovery. Do not restore a database backup for ordinary code bugs. Prefer backward-compatible migrations; restore DB only when a harmful migration corrupted data and newer production data can be discarded.

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
- `pack-server-deploy-source.ps1` creates the server source archive used by deploy.
  - `-RepoRoot`, `-OutputPath`: archive path overrides.
- `run-vps-ef-migration.sh` runs EF migrations from a .NET SDK container on the VPS.
  - Argument 1: EF `DbContext` name.
- `run-vps-production-minimum-seed.sh` applies the minimum production seed on the VPS.

## Seeds

- `seed-local-dev-data.sql` contains local development seed data.
- `seed-production-minimum.sql` contains the minimum production seed.
