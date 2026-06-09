# Backend Architecture

This document records backend design choices that are easy to forget when only looking at code.

## Server Project

The backend web/API project is `src/DailyNagger.Server`.

The project is named `Server`, not `Api`, because the backend may later contain more than HTTP endpoints. The same project can host API endpoints, application services, OpenAPI setup, database access registration, and other server-side wiring.

## API Folder

HTTP endpoint mapping lives in `src/DailyNagger.Server/Api`.

Example:

```text
src/DailyNagger.Server/Api/NagApi.cs
```

The folder is called `Api`, not `Endpoints`, because the user-facing concept is the backend API. The files contain endpoint mapping code, but their purpose is to define the API surface.

`Program.cs` should stay small. It wires the application together and calls API mapping methods such as `MapNagApi()`. The actual route definitions live in the `Api` folder.

## Aggregate Write API

The client creates aggregate instances and assigns IDs before submitting them to the backend.

When the client edits a DDD aggregate, it sends the whole aggregate JSON. The backend validates and persists that aggregate as one atomic operation.

Initial write model:

- Save `Nag` as a whole aggregate, including child rules such as `NagTime` and `NagLocation`.
- Save `NagLog` as a whole aggregate, including its full `NagNode` tree and `NagInput` values.

Conceptual endpoint shape:

```text
PUT /api/nags/{id}
PUT /api/nag-logs/{id}
```

The exact routes can be decided during implementation, but the transaction rule is fixed: all changes for the submitted aggregate are accepted together or rejected together.

Do not make node/input templates or separate partial mutation endpoints the primary model. The user should be able to make on-the-run changes in the active `NagLog` without navigating through separate template menus.

High-frequency `NagInput.value` edits are allowed as a narrow command endpoint under `NagLog`, for example `PATCH /api/nag-logs/{id}/nag-inputs`. The command may update values only. It must validate that all inputs belong to the route `NagLog` and write atomically.

`NagInput.value` edits are allowed only while the owning `NagLog` is open (`closedOn = null`). If a queued update arrives after the worker has closed that log, return `409 Conflict`; the client should flush its queue and fetch a fresh `NagPlan`.

API names should preserve domain names. Entity collections use the entity name pluralized, for example `nagTimes` and `nagNodes`. Value objects use the same concept name across route segments, DTO properties, JSON fields, database columns, tests, and documentation, with only casing/style changed for the layer.

Optimistic concurrency rule:

- The client may later keep a submit queue of small aggregate changes/edits and retry them in the background.
- Aggregate roots such as `Nag` and `NagLog` use a monotonic integer `version` counter.
- Writes include `expectedVersion`.
- The backend updates with a guarded `where version = @expectedVersion`, increments version on success, and returns `409 Conflict` on stale writes.
- The server owns the version. The client stores the last returned version and attaches it to queued writes at send time.
- `PUT /api/nags/{id}` returns the full `NagDto` with the new `version`.
- Server-owned worker updates to `Nag.activeLogDueOn` also increment `Nag.version`.
- Small `NagInput.value` updates still mutate the `NagLog` aggregate and must increment `NagLog.version`.
- `PUT /api/nag-logs/{id}` returns the full `NagLogDto` with the new `version`.
- `PATCH /api/nag-logs/{id}/nag-inputs` returns the new `NagLog` version so the client queue can continue with the correct `expectedVersion`.

## Worker Project

DailyNagger will likely need background work later.

Example background work:

- Create tomorrow's recurring task copies.
- Send reminders.
- Run scheduled cleanup or maintenance.

That should not automatically be placed inside `Program.cs` or the API files. If it becomes real background behavior, prefer a separate worker project such as:

```text
src/DailyNagger.Worker/
```

Reasoning:

- The API answers requests.
- The worker performs scheduled or background work.
- They can still live in the same solution.
- They can become separate Docker images if deployment needs that.

We should not create the worker project before there is actual worker code.

## Active Nag Log Deadline

`Nag.ScheduleUpdatedAt` records when the time rules were last set by the server.

`Nag.ActiveLogDueOn` stores the finish-by date for the active open `NagLog` copy. It is not the date of a future ungenerated occurrence.

`Nag.ActiveLogDueOn` has three distinct meanings:

- real date: timed active log deadline
- `DateOnly.MaxValue`: persistent/open-ended `Nag` with no `NagTime` rules
- `null`: schedule problem requiring user action

An empty `NagTime` list is valid. `SaveNag` should accept it and store `ActiveLogDueOn = DateOnly.MaxValue`.

The copy worker must not deactivate a `Nag` when no future date can be calculated. It should set `ActiveLogDueOn = null` and let the client surface the problem.

The user may complete the current `NagLog` before this date. The date is only the latest day the current log should be completed.

`NagLog` should not have `dueOn`. It should have `closedOn`, which is null while the log is active/open and set when the log is finished/submitted.

Worker behavior:

1. A `NagLog` already exists for the active run.
2. `Nag.ActiveLogDueOn` stores that active log's finish-by date.
3. If the date is not exceeded, the worker does not create a new copy.
4. When the date is exceeded, the worker finds the next finish-by date from the `NagTime` rules.
5. The worker creates a new `NagLog` by copying the previous relevant `NagLog`.
6. The worker updates `Nag.ActiveLogDueOn` to the new log's finish-by date.

The first implemented worker read is `GetLapsedNagAsync(communityId, today, now, copyGracePeriod)`. It returns lightweight `(nagId, activeLogDueOn)` items where `is_deactivated = false`, `active_log_due_on is not null`, `active_log_due_on < today`, an open `NagLog` exists, and `NagLog.updatedAt + copyGracePeriod < now`.

Copy grace protects already-queued client writes around date changes. This is a data-consistency rule, not a UX plan-readiness rule.

`NagLog.updatedAt` is server-owned UTC time and must be updated by both whole `PUT NagLog` saves and narrow `PATCH NagInput.value` updates. The client must not send `updatedAt` as truth.

`NagLog.updatedAt` must be required in the database and must never be the default/min value. Treat `DateTimeOffset.MinValue` as invalid persisted state, because grace-period logic depends on this value being a real server write time.

The worker may copy a lapsed `Nag` only when:

```text
NagLog.updatedAt + gracePeriod < now
```

The grace period is configured as `NagCopyWorker:CopyGracePeriod`. The delegator loop reads it from `IOptionsMonitor<NagCopyWorkerOptions>` on every loop iteration so local config changes can be picked up without restart where the configuration provider supports reload.

The grace period gives the client's existing update queue time to reach the server after the deadline. It should not decide whether the client clears/refetches the screen.

`GET /api/todays-nag-plan` must be the source of truth for whether the requested plan is ready. Before returning a full plan, the endpoint should check for active/not-deactivated `Nag` rows where `ActiveLogDueOn < requested date`.

If any such row exists, required server-side log copying is still pending. Return:

```http
202 Accepted
```

with a small response body such as:

```json
{ "status": "Preparing" }
```

Only return `200 OK` with the full `NagPlan` when no active `Nag` is lapsed for the requested date. `ActiveLogDueOn = DateOnly.MaxValue` is persistent/open-ended and counts as ready. `ActiveLogDueOn = null` is a schedule problem and should be surfaced separately, not treated as lapsed work to copy.

The first implemented worker write is `CopyLapsedNagLogAsync`. It locks the `Nag` row inside the same transaction as the copy, requiring `active_log_due_on = expectedActiveLogDueOn` before copying. If that check fails, the command is stale and does nothing. If it succeeds, it closes the old open `NagLog`, creates a new `NagLog`, copies nodes and inputs with new IDs, remaps parent node references, and updates `Nag.ActiveLogDueOn` atomically.

Copy result meanings:

- `Copied`: normal success; new log created.
- `Stale`: expected date no longer matches; no-op, not a failure.
- `NoFutureOccurrence`: old log closed, no new log created, `ActiveLogDueOn` set to null.
- `Failed`: technical exception caught/logged by the worker wrapper.

`CopyLapsedNagLogResult` should expose explicit status and IDs:

```text
status
nagId
oldNagLogId nullable
newNagLogId nullable
activeLogDueOn nullable
```

Worker wrapper log levels:

- `Copied`: Information
- `Stale`: Debug
- `NoFutureOccurrence`: Warning
- `NoOpenLog`: Error
- thrown exception/failed command: Error

Worker copy architecture rules:

- Treat the copy as one atomic domain write.
- The guarded lock/read of the `Nag` row must happen inside the same transaction as the tree copy.
- A `0` row guarded check means another worker already changed the state, or the command is stale; it should not be treated as a partial failure.
- Each copied `NagLog`, `NagNode`, and `NagInput` gets a new GUID. Reuse statistics through future dimension tags/read models, not shared entity ids.
- Tree traversal and id mapping belong in application code. Persistence should use shared tree-write helpers and batched SQL inserts so API writes and worker copies do not drift.

Worker observability rules:

- Start with Control DB status snapshots for the per-community NagLog copy delegator, not per-event tables.
- Use a `nag_log_copy_delegator_status` table.
- The table represents one `NagCopyDelegatorLoop` instance. It uses `delegator_id`, stable `delegator_name`, and nullable `community_id`.
- Do not use this table for `CommunityLapsedNagLogReconciler` yet; structured logs are enough for the reconciler.
- Store `status` as a string enum: `Starting`, `Running`, `Stopping`, `Stopped`, `Failed`.
- Store lifecycle timestamps: `started_at`, `last_seen_at`, `stopped_at`, and optional `last_error_at`.
- For NagLog copying, write one status snapshot per delegator run, not per copied NagLog. Store run fields such as `last_run_started_at`, `last_run_finished_at`, `last_run_duration_ms`, and `last_run_max_parallelism`.
- Store counters such as `total_run_count`, `total_copied_count`, `total_stale_count`, `total_no_future_occurrence_count`, `total_no_open_log_count`, `total_error_count`, and `error_count_since_last_snapshot`.
- Store coarse app-server durations, not deep SQL diagnostics: `total_db_duration_ms`, `total_processing_duration_ms`, `max_db_duration_ms`, `max_processing_duration_ms`, `last_db_duration_ms`, and `last_processing_duration_ms`.
- `dbDuration` means elapsed app time around DB read/write calls. SQL Server internals, lock waits, query plans, and connection-pool diagnostics belong to SQL Server/observability tooling.
- `processingDuration` means application work between DB calls, such as validation, tree traversal, copy/remap, and DTO/domain mapping.
- Use these metrics to tune `maxParallelCopyWorkers` and decide whether CPU-heavy tree work should later be isolated with `Task.Run`.
- NagLog copy delegator status writes are best-effort. A failure to write observability data must be logged as a warning but must not stop the delegator loop or domain copy command.

Worker orchestration rules:

- The delegator is a scheduler, lapsed-list reader, and concurrency limiter.
- The first testable delegator slice is `NagCopyDelegator.RunOnceAsync`. It uses delegates for lapsed-list reading and worker execution so max-parallel behavior can be tested without SQL or hosted-service infrastructure.
- `NagCopyDelegatorLoop` owns the interval loop around `NagCopyDelegator`.
- `CommunityLapsedNagLogReconciler` owns multi-community reconciliation. It compares active `NagCommunity` ids from Control DB with currently running per-community loops, starts missing loops, and stops loops for communities that are no longer active.
- `NagCopyHostedService` is the ASP.NET Core hosted service entry point for NagLog generation. It starts `CommunityLapsedNagLogReconciler` when `NagCopyWorker:IsHostedServiceEnabled` is true.
- The delegator interval is measured from run start, not from run end. If a run finishes before the configured interval, sleep the remaining time. If a run takes longer than the configured interval, start the next run immediately.
- `CommunityRefreshInterval` controls how often the active community list is reconciled. `DelegatorInterval` controls how often each community loop checks for lapsed nags.
- Loop tests should use fake `getNow` and `delayAsync` delegates instead of real time.
- The delegator should use a configured `maxParallelCopyWorkers` limit. When all copy slots are busy, it waits for a slot before continuing through the current lapsed list.
- The delegator should use async tasks plus `SemaphoreSlim` for I/O-heavy copy work. Do not wrap the whole copy workflow in `Task.Run`; only isolate a measured CPU-heavy tree operation later if metrics show a real need.
- The delegator logs only its own failures, such as failing to read the lapsed list.
- `NagCopyWorker` runs one copy command and is the logging/error boundary for that command. It logs copied/stale/failure outcomes and catches exceptions.
- `NagCopyWorker` returns a small result to `NagCopyDelegator`; it does not write `nag_log_copy_delegator_status` directly.
- `NagCopyDelegator` aggregates worker results in memory and returns one run result to `NagCopyDelegatorLoop`.
- The copy command itself remains a clean atomic domain write and should not know about callbacks, notifications, or delegator state.
- Duplicate dispatch is acceptable. The copy command's transaction guard makes duplicates stale/no-op.

Control DB community activation rules:

- `NagCommunity.isDeactivated` marks a community as disabled without deleting its connection settings.
- Active-community reads for worker scheduling must exclude deactivated communities.
- Reconciliation should cancel future scheduling for removed/deactivated communities.
- If a per-community `NagCopyDelegatorLoop` is already inside `RunOnceAsync`, the current run/batch should be allowed to finish. The loop must not start another run after the community has been removed/deactivated.
- Already started NagLog copy commands should finish or roll back cleanly instead of being killed halfway.
- The real hosted-service wiring uses separate cancellation scopes: community removal cancels scheduling, while host shutdown can cancel the whole hosted service.

Future timezone/day-boundary rule:

- User settings should own timezone/day-boundary configuration.
- The rule applies to all of the user's `Nag` records, not individual `Nag` records.
- Do not put day-boundary settings on `Nag`; that would make both UX and worker behavior hard to reason about.
- Example future fields: `timeZoneId = "Europe/Copenhagen"` and `dayBoundaryTime = "04:00"`.
- This can wait until the client/user settings model exists.

Active log query shape:

```sql
select *
from nag_log
inner join nag on nag_log.nag_id = nag.id
where nag_log.closed_on is null
```

Reasoning:

- `Active` says the date belongs to the currently created/latest `NagLog`.
- `Log` keeps the relation to the copied concrete aggregate explicit.
- `DueOn` says this is the date the active log should be completed by.
- Avoid `NextOccurrenceOn`; it is misleading because it sounds like an uncreated future occurrence.

## DDD Naming Direction

The agreed future domain model is documented in `docs/ddd-naming-and-data-structure.md`.

The current backend uses `Nag` and `NagTime` for the first renamed slice. The broader intended direction is:

```text
Nag
|- NagTime
|- NagLocation

NagLog
|- NagNode
   |- NagInput
```

The important rule is that later `NagLog` records are copied from the previous relevant `NagLog`, not from a separate template object. This keeps on-the-day changes and latest values as the source for the next copy.

## Multi-Tenant Routing

DailyNagger currently uses two database roles:

```text
Control DB -> knows which community uses which Data DB
Data DB    -> stores DailyNagger task data
```

The multi-tenant idea is based on `NagCommunity`.

A user may belong to multiple communities, such as:

- Family.
- Shared chores.
- Fitness group.
- Party planning.

Each community can point to a Data DB. This lets a community later be hosted separately if privacy or ownership requires it.

The current design is intentionally simple. It is enough for learning and for testing Control DB lookup, Data DB routing, and caching. It is not a complete enterprise tenant model.

## Connection String Storage

The Control DB stores the Data DB connection string template for a community.

The template should contain routing information such as server, database name, and user id. Password handling is separate. For local development and CI, the password can come from configuration/environment variables.

Reasoning:

- Control DB answers where the community data lives.
- Secrets should not be committed to Git.
- Later, `PasswordSecretName` can point to a real secret store.

## Configuration Layers

The backend reads configuration through ASP.NET Core's combined configuration system, not by manually opening JSON files in application code.

Current configuration layers:

- `appsettings.json`: shared defaults.
- `appsettings.Development.json`: shared development defaults.
- `appsettings.Local.json`: ignored local machine overrides, added explicitly in `Program.cs` with `optional: true` and `reloadOnChange: true`.
- Environment variables: runtime overrides and secrets.

`builder.Configuration.GetSection("SomeSection")` means "read this section from the combined configuration view". The value may come from any configured layer.

Rules:

- Use typed options for cohesive feature configuration. Current examples are `DataDbConnectionOptions` and `NagCopyWorkerOptions`.
- Use `IOptionsMonitor<T>` when a running process should observe config changes without restart.
- Direct `IConfiguration` reads are acceptable for simple infrastructure values that are read at the moment they are needed and do not need a typed options object yet.
- Do not make domain commands read configuration directly. Configuration belongs at the application/infrastructure boundary.

## Connection String Caching

Resolved Data DB connection strings are cached with `IMemoryCache`.

The cache key includes both a purpose prefix and the community id:

```text
data-db-connection-string:{communityId}
```

Reasoning:

- `IMemoryCache` is shared by many features inside the process.
- The prefix prevents collisions with unrelated cached values.
- The community id selects the correct Data DB route.

The cache lifetime is configured through application settings, not hardcoded in the method.

## Cached Connection Validity

The cached connection string is not assumed to be valid forever.

When the server needs a Data DB connection, it can open the connection. If opening fails because the cached route is stale, the server refreshes the connection string from Control DB and tries opening once more.

If that second attempt also fails, the API returns an error instead of hiding the problem.

Reasoning:

- Control DB can be updated without manually flushing app memory.
- One automatic refresh handles common stale-cache cases.
- Repeating forever would hide real operational problems.

## Client Retry Choice

If a request fails after the server has refreshed the cached connection string once, the client receives an error.

The client may show a normal failure message and let the user decide whether to retry.

Reasoning:

- The server should not retry indefinitely.
- The client knows whether retrying makes sense for the user flow.
- This avoids duplicate writes and confusing long waits.

For reads, retry is usually low risk. For writes, retry must be designed carefully because the first attempt might have partially succeeded.

## EF Core SQL Retry

The server enables EF Core SQL retry for normal SQL Server access.

This is useful for transient failures, especially in containers and cloud environments where SQL Server can be briefly unavailable.

Tests that manually open transactions should not blindly use the retrying execution strategy. EF Core requires a different transaction pattern when retry is enabled.
