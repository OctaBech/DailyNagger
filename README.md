# DailyNagger

DailyNagger is a personal planning app with a React Native/Expo mobile client
and an ASP.NET Core API.

It is built around tree-shaped tasks, offline-first local writes, queued server
sync, Sentry/Seq observability, and small architecture boundaries that keep user
actions, tree changes, and production behavior readable.

DailyNagger is a personal project. Scripts for production deploy, backup,
smoke, and rollback inspection require secrets outside the repository.

## Repository Map

- `src/DailyNagger.Mobile` contains the React Native/Expo mobile app.
- `src/DailyNagger.Server` contains the ASP.NET Core API and data access.
- `src/api-contracts` contains generated TypeScript API contracts from the
  server OpenAPI document.
- `scripts` contains repeatable local, mobile, and production helper scripts.
- `docs/adr` contains active architecture and product decisions.
- `docs/runbooks` contains operational notes for production workflows.

## Start Local Development

Use this when setting up or refreshing the local development environment from
the repository root.

1. Restore project dependencies and local tool expectations.

   ```powershell
   .\scripts\bootstrap-dev.ps1
   ```

   The script prepares a fresh checkout and keeps heavyweight development state
   on the configured development drive where possible.

2. Start the local stack.

   ```powershell
   docker compose -f .\compose.yaml up -d
   ```

   This starts SQL Server, Seq, database initialization, and the local API
   container.

3. Check the API.

   ```powershell
   Invoke-RestMethod http://localhost:5007/api/health
   Invoke-RestMethod http://localhost:5007/api/health/database
   ```

   These checks verify that the local server and database are reachable.

4. Reset local data when needed.

   ```powershell
   .\scripts\reset-local-db.ps1
   ```

   This recreates the local databases and applies development seed data.

Local ports:

- `5007` exposes the Docker-hosted API.
- `5010` is used by `scripts/start-local-api.ps1` for direct local API runs.
- `1433` exposes SQL Server.
- `5341` exposes the local Seq UI.

## Run Mobile

Use this when working on the app UI on a local machine.

```powershell
cd .\src\DailyNagger.Mobile
npm install
npm run android
```

The Android command uses `scripts/start-mobile-android.ps1` so local Gradle and
Android paths stay consistent with the project setup.

## Build APK

Use this when building a release APK for a connected Android device.

```powershell
.\scripts\build-mobile-release-apk.ps1 -Notify
```

GitHub Actions also has a manual mobile APK workflow that builds an unsigned,
short-lived APK artifact on a clean runner.

## Verify Changes

Use these checks before pushing or sharing code.

```powershell
dotnet test .\DailyNagger.sln
npm run mobile:typecheck
npm run mobile:lint
npm run contracts:check
```

Server tests that need SQL Server can also be run through:

```powershell
npm run server:test
```

## Production Scripts

Use this only from a trusted machine with production secrets available.

```powershell
.\scripts\use-production-secrets.ps1
.\scripts\deploy-production.ps1 -Notify
.\scripts\smoke-production.ps1
```

`use-production-secrets.ps1` loads session variables for the current PowerShell
session. Secrets are not stored in the repository. Production workflow details
live in `docs/runbooks/production-deploy.md`.
