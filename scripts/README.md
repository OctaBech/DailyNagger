# Scripts

Scripts are part of DailyNagger's operational memory. Prefer improving these
over keeping deployment or build steps only in chat history.

## Local Development

- `reset-local-db.ps1` drops, recreates, migrates, and seeds the local SQL Server
  databases. This is destructive for local database data.
- `start-local-api.ps1` starts the local API project.

## Mobile

- `build-mobile-release-apk.ps1` builds the Android release APK and installs it
  on a connected device unless `-SkipInstall` is used.
- Use `-Notify` when the build can run while you do something else.

## Server Deploy

- `deploy-server.ps1` packages server source, uploads it to the VPS, builds a
  uniquely tagged Docker image, runs migrations, restarts services, and smoke
  tests production.
- `pack-server-deploy-source.ps1` creates the source archive used by deploy.
- `run-vps-ef-migration.sh` runs EF migrations from an SDK container on the VPS.
- `run-vps-production-minimum-seed.sh` seeds the minimum production data.

## Seeds

- `seed-local-dev-data.sql` is local development seed data.
- `seed-production-minimum.sql` is the minimal production seed.

## Rule

If a command becomes important enough to repeat, put it in a script or improve
an existing script.
