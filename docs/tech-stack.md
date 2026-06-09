# Tech Stack

## Target

DailyNagger should run on:

- Android, including Samsung Galaxy S10 Lite.
- Web browsers.

The backend should use C# with Microsoft SQL Server and code-first database structure.

## Recommended Architecture

```text
React / TypeScript client
        |
Generated typed API client
        |
ASP.NET Core Web API
        |
EF Core code-first model
        |
Microsoft SQL Server
```

## Backend

Recommended backend:

- ASP.NET Core.
- Entity Framework Core.
- SQL Server.
- Code-first migrations.
- OpenAPI enabled for API documentation and typed client generation.
- IMemoryCache for small server-side lookup caches, such as resolved community Data DB connection strings.

The backend owns:

- Nag.
- Task trees.
- Repeat-copy generation.
- Completion fields and completion history.
- Suggestions.
- Saved charts later.

Backend architecture details, including the `Api` folder, future worker project, multi-tenant routing, cached connection strings, and retry behavior, are documented in `docs/backend-architecture.md`.

## Client

Recommended client:

- React with TypeScript.
- Shared UI patterns for web and Android where practical.
- Generated TypeScript API client from the ASP.NET Core OpenAPI document.

Two viable client approaches:

1. React Native with Expo and React Native Web.
2. React web app plus Capacitor for Android packaging.

For the MVP, choose the route that gets a working Android install and browser version fastest. If phone sensors become central, React Native/Expo is likely the better long-term path. If the first goal is CRUD, charts, and browser polish, React web plus Capacitor may be simpler.

## Typed Client

Prefer generated TypeScript clients over hand-written request wrappers.

Good options:

- OpenAPI generation from ASP.NET Core.
- NSwag or similar code generation for TypeScript clients.

This gives the React client strong typing without making SignalR carry normal CRUD behavior.

## SignalR

SignalR is useful, but it should not be the default RPC layer for everything.

Use SignalR for:

- Realtime updates when another client changes data.
- Server push notifications while the app is open.
- Live sync status.
- Later collaborative or multi-device behavior.

Use normal HTTP API endpoints for:

- Creating tasks.
- Updating tasks.
- Completing tasks.
- Loading lists.
- Loading history.
- Saving chart setups.

Reasoning:

- HTTP endpoints are easier to test.
- OpenAPI gives typed client generation.
- Browser and mobile debugging is simpler.
- SignalR stays focused on realtime events.

## Database Naming

Use entity-matching table names.

Rules:

- C# entity names are singular PascalCase.
- Database table names are singular snake_case.
- Do not pluralize table names.
- Database column names use snake_case.
- C# properties keep idiomatic PascalCase.

Examples:

```text
Nag         -> nag
NagTime     -> nag_time
NagLocation -> nag_location
NagLog      -> nag_log
NagNode     -> nag_node
NagInput    -> nag_input
```
