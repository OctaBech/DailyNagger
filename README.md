# DailyNagger

DailyNagger is a present-focused task app. It exists to reduce mental load so
the user can open the app, see what matters now, act, and leave.

The current product direction is captured in
[`docs/adr/0001-current-direction.md`](docs/adr/0001-current-direction.md).

## Current Shape

- `src/DailyNagger.Server` contains the ASP.NET Core API and EF Core data model.
- `src/DailyNagger.Mobile` contains the React Native/Expo mobile app.
- `scripts` contains local build, deploy, and database helper scripts.
- `docs/adr` contains active architecture/product decisions.
- `docs/archive` is a local ignored archive of old notes and is not repo truth.

## Local API

From the repository root.

Start local dependencies and server:

```powershell
docker compose -f .\compose.yaml up -d
```

Check health:

```powershell
Invoke-RestMethod http://localhost:5007/api/health
Invoke-RestMethod http://localhost:5007/api/health/database
```

Reset local databases and seed dev data:

```powershell
.\scripts\reset-local-db.ps1
```

## Mobile

Install dependencies from the mobile project folder:

```powershell
cd .\src\DailyNagger.Mobile
npm install
```

Build and install the release APK on a connected Android device:

```powershell
.\scripts\build-mobile-release-apk.ps1 -Notify
```

## Server Deploy

Deploy the server to the VPS:

```powershell
.\scripts\deploy-server.ps1 -Notify
```

Deploy without running migrations only when the production schema is already up
to date:

```powershell
.\scripts\deploy-server.ps1 -SkipMigrations -Notify
```

## Verification

Common checks:

```powershell
dotnet test .\DailyNagger.sln
npm run mobile:typecheck
npm run mobile:lint
```
