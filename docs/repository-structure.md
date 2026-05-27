# Repository Structure

This repository keeps project source code under `src`.

```text
src/
  DailyNagger.Api/
  DailyNagger.Client/
docs/
compose.yaml
.env.example
```

## `src/DailyNagger.Api`

Used by the .NET SDK.

This is the ASP.NET Core backend project. It contains the API endpoints and will later contain backend application code.

This folder belongs in Git.

Alternative: place backend projects at the repository root. Keeping them under `src` scales better when the repository gains more projects.

> "The backend is a .NET project under `src/DailyNagger.Api`, identified by its `.csproj` file."

## `src/DailyNagger.Client`

Used by Node.js, npm, TypeScript, and Vite.

This is the React browser client project. It contains frontend source code and frontend package configuration.

This folder belongs in Git, except generated folders such as `node_modules` and `dist`.

Alternative: keep the frontend in a root-level `client` folder. Keeping it under `src` makes future clients and services easier to organize.

> "The frontend is an npm project under `src/DailyNagger.Client`, identified by its `package.json` file."

## `docs`

Used by developers.

This folder contains product notes, environment documentation, terminology, and working style.

This folder belongs in Git.

Alternative: keep all documentation in `README.md`. Separate docs are easier to maintain as the project grows.

> "The `docs` folder contains project knowledge that should be shared with future developers."

## `compose.yaml`

Used by Docker Compose.

This file describes supporting development services, currently SQL Server.

This file belongs in Git.

Alternative: install services manually. Docker Compose is more reproducible.

> "`compose.yaml` is the shared recipe for local development services."

## `src/DailyNagger.Api/Dockerfile`

Used by Docker.

This file builds the API image.

This file belongs in Git.

Alternative: run the API only with `dotnet run`. A Dockerfile makes the API runtime reproducible.

> "The API Dockerfile is the recipe for building the backend container image."

## `src/DailyNagger.Client/Dockerfile`

Used by Docker.

This file builds the React development image.

This file belongs in Git.

Alternative: run the client only with local npm. A Dockerfile gives us a reproducible Node runtime.

> "The client Dockerfile is the recipe for running the React development server in a container."

## `.github/workflows/ci.yml`

Used by GitHub Actions.

This file defines the CI workflow.

This file belongs in Git.

Alternative: rely only on local builds. CI is better because it verifies the project from a clean checkout.

> "The CI workflow proves the backend, tests, frontend, and Dockerfiles work outside my local machine."

## `.env.example`

Used by developers.

This file documents required local environment variables.

This file belongs in Git.

Alternative: document variables only in prose. A real example file is easier to copy.

> "`.env.example` shows which local environment variables each developer must provide."

## `.env`

Used by Docker Compose.

This file contains private local values such as passwords.

This file does not belong in Git.

Alternative: put values directly in `compose.yaml`. That would commit local secrets, so we avoid it.

> "`.env` contains private local values and must stay out of Git."

## `src/DailyNagger.Api/appsettings.Local.json`

Used by the ASP.NET Core API during local development.

This file contains local machine values, such as the local database connection string.

This file does not belong in Git and must not be copied into Docker images.

Alternative: use ASP.NET Core user secrets. A local ignored JSON file keeps the value visible inside this learning project without committing it.

> "`appsettings.Local.json` is for local API settings only. It is ignored by Git and excluded from Docker images."

## `.dockerignore`

Used by Docker.

This file tells Docker which files must not be copied into image build context.

This file belongs in Git.

Alternative: rely on each Dockerfile to avoid copying sensitive files. `.dockerignore` is safer because it blocks them before the build starts.

> "`.dockerignore` prevents local secrets, build output, and dependencies from being copied into Docker images."
