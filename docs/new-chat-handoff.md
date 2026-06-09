# DailyNagger New Chat Handoff

Use this file as compact startup context for a new Codex chat.

## Project Location

The real project is here:

```text
E:\Development\DailyNagger
```

Do not use `C:\Users\Marti\OneDrive\Documents\DailyNagger` as the project folder.

## Current Goal

DailyNagger is a DDD-inspired nag/task app. The backend foundation is intentionally built before the client so the data model, consistency rules, and worker flow are robust.

The next major learning goal is to build an Android mobile client with Expo/React Native and TypeScript, so Martin can learn frontend/mobile/full-stack work hands-on.

## Domain Model

Core names:

- `Nag`: aggregate root. The recurring thing/user-defined workflow, for example `Gym - Push day`.
- `NagTime`: child entity under `Nag`. Schedule rules such as every Monday.
- `NagLog`: aggregate root. The concrete active/copied run of a `Nag`.
- `NagNode`: child entity under `NagLog`. Tree/composite node, for example `Bench press`, `Set 1`.
- `NagInput`: child entity under `NagNode`. Actual user input, for example reps, kg, checkbox, note.

Do not use templates. A new `NagLog` is copied from the previous relevant `NagLog`, including latest values/on-the-run changes.

`Nag` and `NagLog` are separate aggregate roots. Reference by ID, not aggregate nesting.

## Write Rules

- Whole `Nag` saves are atomic.
- Whole `NagLog` saves are atomic and include full `NagNode`/`NagInput` tree.
- Client-created GUIDs are used.
- Client sends full aggregates for structural edits.
- Small `PATCH /api/nag-logs/{id}/nag-inputs` updates are allowed only for frequent `NagInput.value` changes.
- `PATCH NagInput.value` must:
  - validate all inputs belong to the requested `NagLog`
  - validate `value` against stored `valueType`
  - require `NagLog.closedOn = null`
  - return `409 Conflict` if the log is closed or version is stale
  - update `NagLog.version`
  - update server-owned `NagLog.updatedAt`

Optimistic concurrency:

- `Nag.version` and `NagLog.version` are monotonic integer counters.
- Client writes include `expectedVersion`.
- Backend increments version on success.
- Stale writes return `409 Conflict`.

## Important Field Rules

`Nag.ActiveLogDueOn` is the finish-by date for the active open `NagLog`.

Meanings:

- real date: deadline for active log
- `DateOnly.MaxValue`: persistent/open-ended, no `NagTime` rules
- `null`: schedule problem requiring user action

Do not put `dueOn` on `NagLog`.

`NagLog.closedOn` tells whether the concrete log is finished.

`NagLog.updatedAt`:

- server-owned UTC time
- not nullable
- must never be `DateTimeOffset.MinValue`
- updated by whole `PUT NagLog`, narrow `PATCH NagInput.value`, and worker close/copy

## Copy Worker

Worker copy flow is implemented as hosted service:

```text
NagCopyHostedService
-> CommunityLapsedNagLogReconciler
-> one NagCopyDelegatorLoop per active community
-> NagCopyDelegator
-> NagCopyWorker
-> DataDbWrite.CopyLapsedNagLogAsync
```

Config:

```json
"NagCopyWorker": {
  "IsHostedServiceEnabled": true,
  "CommunityRefreshInterval": "00:05:00",
  "DelegatorInterval": "00:15:00",
  "CopyGracePeriod": "00:10:00",
  "MaxParallelCopyWorkers": 4
}
```

The hosted worker starts automatically on backend startup when `IsHostedServiceEnabled = true`.

Copy rules:

- The copy command locks/verifies the `Nag` row inside the same transaction.
- It requires `active_log_due_on = expectedActiveLogDueOn`.
- If guarded update/check affects 0 rows, treat as stale/no-op.
- Old open `NagLog` is closed.
- New `NagLog`, `NagNode`, and `NagInput` get new GUIDs.
- Node parent IDs are remapped.
- `NagInput.value` becomes new `previousValue`; new `value` is null.
- `Nag.ActiveLogDueOn` is moved to the next calculated date.
- If no future occurrence exists, close old log, create no new log, set `ActiveLogDueOn = null`.
- Deactivated `Nag` is ignored by plan and worker. Existing open `NagLog` remains unchanged.

Copy grace:

```text
NagLog.updatedAt + CopyGracePeriod < now
```

SQL may use cutoff form:

```text
nag_log.updated_at < now - CopyGracePeriod
```

Grace is only for data consistency around queued client writes. It is not UX plan-readiness logic.

## Read Model

Primary daily client read:

```http
GET /api/todays-nag-plan?communityId={id}&userId={id}&date={date}
```

Compatibility alias:

```http
GET /api/nag-plan?communityId={id}&userId={id}&date={date}
```

`NagPlan` is a read model, not an aggregate root.

It returns:

```text
NagPlan
|- date
|- nags[]
   |- Nag fields
   |- nagTimes[]
   |- nagLog
      |- nagNodes[]
         |- nagInputs[]
         |- nagNodes[]
```

Plan readiness rule:

- If any active/not-deactivated `Nag` has `ActiveLogDueOn < requested date`, required copy work is still pending.
- In that case endpoint should return:

```http
202 Accepted
{ "status": "Preparing" }
```

- Return `200 OK` with full plan only when no active `Nag` is lapsed for the requested date.
- `DateOnly.MaxValue` counts as ready.
- `ActiveLogDueOn = null` is a schedule problem and should be surfaced separately.

## Current Backend Status

Backend foundation is robust for the central model:

- DDD-inspired aggregate boundaries
- atomic aggregate writes
- narrow `PATCH` input updates
- version counters
- server-owned `updatedAt`
- copy grace
- hosted worker/delegator/reconciler
- worker observability snapshots
- `TodaysNagPlan` read model
- indexes for current worker/read queries
- SQL Server integration tests

Latest known test status:

```text
dotnet test DailyNagger.sln --no-restore
Passed: 85/85
```

## Not Production Complete Yet

Known missing areas:

- real auth/authentication
- authorization/ownership checks
- full SignalR notification flow
- production deployment
- production secrets handling
- frontend client
- category/location UX

For personal phone use, a pragmatic first client can use a configured `communityId`/`userId` and a simple dev API key before real auth.

## Frontend Learning Direction

Martin wants to learn frontend/mobile/full-stack through this project.

Since Martin uses Android, Expo/React Native is a realistic first mobile path:

- TypeScript
- React components/hooks/state
- React Native styling/layout
- API client
- render `TodaysNagPlan`
- nested `NagNode` tree UI
- input components for text/integer/decimal/boolean
- local edit state
- `PATCH NagInput.value`
- queue/retry/conflict recovery
- `202 Preparing` handling
- `409 Conflict` handling

Client recovery rule:

```text
conflict/corruption/external update
-> flush/send queued updates in order if appropriate
-> fetch full TodaysNagPlan
```

Do not rely on fetching/merging individual logs as normal workflow.

## Conversation Style

Martin prefers concise answers. Avoid long text unless requested. He likes short, practical explanations and asks many clarifying questions to learn professional terminology and best practice.

When coding:

- read existing code first
- make small test-driven slices
- update docs when domain rules change
- run `dotnet test DailyNagger.sln --no-restore`

