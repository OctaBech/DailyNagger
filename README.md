# DailyNagger

DailyNagger is a mobile todo app concept built around structured recurring tasks and context-aware reminders.

The core idea is a todo list that can contain nested checklists, reuse previous items while typing, and nag the user based on time, place, movement, and other phone context.

## Product Shape

- Tasks can contain subtasks.
- A parent task can behave like a project, routine, shopping list, workout, or errand.
- Important repeating routines can be pinned as large home-screen buttons.
- Date-based reminders can appear as countdown buttons that move up as they become urgent.
- Subtasks can be reused from previous entries through typeahead suggestions.
- Tasks can repeat weekly, monthly, yearly, on a specific date, or on a custom interval.
- Reminders can be scheduled before, at, or after the target time.
- Tasks can define completion fields, such as kg, reps, morning weight, calories, or flags like "ate gluten".
- Nagging can be driven by phone context such as location, motion/activity, time of day, and device state.

## Recommended Stack

For a first implementation:

- ASP.NET Core backend in C#.
- Entity Framework Core code-first model.
- Microsoft SQL Server database.
- React/TypeScript client with a generated typed API client.
- Android support targeting Galaxy S10 Lite.
- Browser support for desktop/mobile web.
- SignalR reserved for realtime updates and push-style events, not the primary CRUD API.

## First MVP

1. ASP.NET Core + EF Core + SQL Server backend.
2. React/TypeScript client with generated API types.
3. Task series table for recurrence/reminder/nag/surface behavior.
4. Task table for concrete task/list rows with parent-child relationships.
5. Home screen with pinned, countdown, and normal sections.
6. Contextual add setup sheet.
7. Completion fields and completion history.
8. Simple repeat-by-copy behavior.
9. Basic history view.

See [docs/mvp-scope.md](docs/mvp-scope.md) for the exact first implementation target.

## Important Platform Constraint

Phones do not allow apps to freely run all sensors in the background forever. iOS and Android restrict background location, motion, battery, and notification behavior. The app should model nagging as rules that use allowed platform events, not as a constantly running background process.

See [docs/product-spec.md](docs/product-spec.md), [docs/data-model.md](docs/data-model.md), [docs/ux-flow.md](docs/ux-flow.md), [docs/tech-stack.md](docs/tech-stack.md), and [docs/mvp-scope.md](docs/mvp-scope.md) for the initial design.

## Scaffold

This repository starts with a minimal learning scaffold:

- `DailyNagger.sln`
- `src/DailyNagger.Api`: ASP.NET Core Web API targeting `.NET 10` / `C# 14`.
- `src/DailyNagger.Client`: React 19 + TypeScript + Vite client with a placeholder screen.

The .NET support abbreviation is `LTS`, meaning Long Term Support. The current scaffold uses `.NET 10 LTS`; C# 14 is the matching latest C# language version for that SDK.

Development should follow [docs/working-style.md](docs/working-style.md): tiny steps, practical explanations, best-practice context, and clear alternatives without large jumps ahead.

Terminology notes live in [docs/terminology.md](docs/terminology.md).

Development environment notes live in [docs/development-environment.md](docs/development-environment.md).

Repository structure notes live in [docs/repository-structure.md](docs/repository-structure.md).

Useful commands:

```powershell
dotnet build DailyNagger.sln
cd src\DailyNagger.Client
npm.cmd install
npm.cmd run build
```
