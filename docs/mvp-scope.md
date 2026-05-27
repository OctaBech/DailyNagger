# MVP Scope

This document is the implementation target for the first build.

## Build First

1. ASP.NET Core solution.
2. EF Core code-first model.
3. SQL Server local development setup.
4. React/TypeScript client.
5. Generated typed API client from OpenAPI.
6. Basic responsive UI that works in a browser.
7. Android packaging path decided early.

## MVP Features

### Task Series

Implement `task_series` as the owner of high-level behavior:

- Title.
- Icon.
- Surface mode: pinned, countdown, normal, hidden.
- Pin order.
- Recurrence rule.
- Reminder rule.
- Nag rule placeholder.

### Tasks

Implement `tasks` as concrete rows:

- `seriesId`.
- `parentId`.
- `copiedFromTaskId`.
- Title.
- Icon.
- Notes.
- Status.
- Due date.
- Sort order.

A task can act as a list when other tasks reference it as `parentId`.

For MVP, the UI should support two visible levels:

- Top-level series/task.
- Child checklist items.

Keep the database flexible enough for deeper nesting, but do not build infinite-depth UI yet.

### Home

Implement a home screen with:

- Pinned section.
- Countdown section.
- Normal/due section.
- Bottom actions:
  - Left: charts placeholder.
  - Center: history.
  - Right: add.

### Add Flow

Implement the lower-right plus button:

- Opens floating setup sheet.
- Uses current context.
- Home creates top-level task/series.
- Inside a task creates a child task.
- Swipe/dismiss behavior can be basic at first.

### Suggestions

Implement reusable title suggestions:

- Child item suggestions default to current parent.
- Wide suggestions can be added after the narrow version works.
- Unit tags default to global search later.

### Completion

Implement completion fields:

- Number.
- Text.
- Boolean.

Implement completion history:

- Completion datetime.
- Completion values.
- Optional note.

Defer location stamping until core completion works.

### Repeat By Copy

Implement simple repeat-by-copy:

- When a repeated task is completed, create the next task by copying the previous task tree.
- Keep `seriesId`.
- Set `copiedFromTaskId`.
- Copy child tasks.
- Show previous completion values as reference/defaults later.

### History

Implement basic history:

- Center-bottom history button.
- Show repeated copies in a history view.
- Swipe UI can be simplified initially.

## Defer

Do not build these in the first pass:

- Sensor nagging.
- Location matching.
- Geofencing.
- Push-Pull-Legs rotating recurrence.
- Saved charts.
- Chart rendering.
- Custom image icons.
- Cloudinary/ImageKit.
- Advanced unit/tag management.
- Arbitrary-depth nested UI.
- SignalR realtime sync.

## First Definition Of Done

The MVP is useful when a user can:

1. Open the app in a browser.
2. Create a pinned `Gym` series.
3. Add `Squats` and `Bench press` as child tasks.
4. Configure kg/reps completion fields.
5. Complete the gym task.
6. See completion history.
7. Generate the next gym repeat by copying the previous one.
