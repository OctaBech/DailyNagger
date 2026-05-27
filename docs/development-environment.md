# Development Environment

The first goal is to make the project easy to run, build, and explain from a clean machine.

## Required Now

- **.NET SDK 10 LTS**: builds and runs the ASP.NET Core API.
- **Node.js + npm**: installs and builds the React/TypeScript client.
- **Git**: version control and later CI integration.
- **WSL 2**: provides the Linux environment used by Docker Desktop on Windows.
- **Docker Desktop**: runs containers for consistent local and integration environments.
- **Editor/IDE**: Visual Studio, Rider, or VS Code.

## Useful Soon

- **GitHub Actions**: CI checks for backend and frontend builds.

## Not Required Yet

- Cloud hosting.
- Production deployment.
- Mobile packaging.
- Database migrations.

## Why This Order

Start with the smallest environment that proves the skeleton works:

1. Build the backend.
2. Build the frontend.
3. Run both locally.
4. Add CI.
5. Add containers with Docker Desktop and WSL 2.
6. Add database.

This keeps each step explainable and avoids hiding too many concepts inside tooling.

## Verified Local Versions

- .NET SDK: `10.0.101`
- Node.js: `v24.11.1`
- npm: `11.6.2`
- Git: `2.43.0.windows.1`
- WSL: `2.6.3.0`
- Docker CLI: `29.2.1`
- Docker Compose: `v5.1.0`
- SQL Server container: `Microsoft SQL Server 2022 (RTM-CU25)`, Developer Edition on Linux

Docker Desktop command-line tools are installed, but the Docker engine was not reachable during verification. Start Docker Desktop before running containers.

Project-owned configuration should live in this repository, not in a user profile folder. Docker Desktop may keep its own per-user tool configuration under the Windows user folder, but the project should not depend on that file.

The Docker CLI reported that its per-user config file could not be read because access was denied. Treat that as a local Docker Desktop/user-permission issue, not as project configuration. If Docker commands keep warning after Docker Desktop starts, fix Docker Desktop or the user's Docker config permissions outside the project.

## Version Pinning

- `global.json` pins the .NET SDK version for the solution.
- `.node-version` documents the Node.js version used for the client.
- `.npmrc` keeps the npm cache inside the repository folder as ignored local tool state. The client has its own `.npmrc` because npm commands are run from `src/DailyNagger.Client`.

The project pins SDK/runtime tooling where practical, while package versions are pinned through `package-lock.json` for npm dependencies.

## CI

GitHub Actions uses `.github/workflows/ci.yml`.

The workflow builds the backend, runs backend tests, builds the frontend, and validates the API and client Docker images.

> "CI proves the project builds from a clean checkout instead of only working on one developer's machine."

## Current Local Endpoints

When Docker Compose is running:

- API: `http://localhost:5007`
- API health: `http://localhost:5007/api/health`
- Client: `http://localhost:5173`
- SQL Server: `localhost,1433`

## Local Database

SQL Server runs through Docker Compose.

- `compose.yaml` defines the SQL Server service.
- `.env.example` documents required environment variables.
- `.env` contains local-only values and is ignored by Git.

Start the database:

```powershell
docker compose up -d sqlserver
```

Stop the database:

```powershell
docker compose down
```

Check container status:

```powershell
docker compose ps
```

Verify SQL Server from inside the container:

```powershell
docker exec dailynagger-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "<local-password>" -C -Q "SELECT @@VERSION"
```
