# Data Model

This document is the current data-model reference for the implemented DailyNagger backend.

It intentionally documents only the model that exists now. Future product ideas belong in the short future-notes section at the end until they are designed and implemented.

DailyNagger does not use `Task`, `TaskSeries`, or a task-table model.

## Current Model

```text
Nag
|- 0..n NagTime

Nag 1:n NagLog

NagLog
|- 1..n NagNode
   |- 0..n NagNode
   |- 0..n NagInput

NagInputUnitSuggestion
```

`Nag` and `NagLog` are separate aggregate roots.

`Nag` is the plan/root. It owns the time rules that decide the active log deadline.

`NagLog` is one concrete copied run of a `Nag`. It owns the node/input tree for that run.

## Nag

`Nag` table: `nag`

```ts
type Nag = {
  id: string;
  title: string;
  scheduleUpdatedAt: string;
  activeLogDueOn: string | null;
  expiresOn: string | null;
  isDeactivated: boolean;
  version: number;
  nagTimes: NagTime[];
};
```

Rules:

- `Nag.activeLogDueOn` is the finish-by date for the active open `NagLog`.
- `Nag.activeLogDueOn = DateOnly.MaxValue` means open-ended/persistent because there are no `NagTime` rules.
- `Nag.activeLogDueOn = null` means the schedule chain has a problem and the client should surface it.
- `Nag.isDeactivated` is the explicit off-state flag. New nags default to active.
- `Nag.version` is server-owned optimistic concurrency state.
- `Nag.scheduleUpdatedAt` is server-owned UTC time for the latest schedule write.

## NagTime

`NagTime` table: `nag_time`

```ts
type NagTime = {
  id: string;
  nagId: string;
  timeType: "Weekly" | "MonthlyDay" | "YearlyDate";
  dayOfWeek: string | null;
  dayOfMonth: number | null;
  monthOfYear: number | null;
};
```

Rules:

- `Weekly` requires `dayOfWeek`.
- `MonthlyDay` requires `dayOfMonth`.
- `YearlyDate` requires `dayOfMonth` and `monthOfYear`.
- Empty `Nag.nagTimes` is valid and makes the nag open-ended.

## NagLog

`NagLog` table: `nag_log`

```ts
type NagLog = {
  id: string;
  nagId: string;
  copiedFromNagLogId: string | null;
  closedOn: string | null;
  updatedAt: string;
  version: number;
  nagNodes: NagNode[];
};
```

Rules:

- `NagLog.closedOn = null` means the log is open/active.
- A `NagLog` must not have its own `dueOn`; the deadline/cursor belongs on `Nag.activeLogDueOn`.
- `NagLog.updatedAt` is server-owned UTC time and must be a real write time, not a default/min value.
- `NagLog.version` is server-owned optimistic concurrency state.
- There should normally be one open `NagLog` per `Nag`.

## NagNode

`NagNode` table: `nag_node`

```ts
type NagNode = {
  id: string;
  nagLogId: string;
  parentNagNodeId: string | null;
  name: string;
  sortOrder: number;
  nagInputs: NagInput[];
  nagNodes: NagNode[];
};
```

Rules:

- `NagNode.name` is the display name. Do not use `NagNode.title`.
- `NagNode.nagLogId` asserts aggregate ownership.
- `NagNode.parentNagNodeId` builds the self-referencing node tree.
- A node may have child nodes, inputs, both, or neither.

## NagInput

`NagInput` table: `nag_input`

```ts
type NagInput = {
  id: string;
  nagLogId: string;
  parentNagNodeId: string;
  label: string;
  description: string | null;
  valueType: "Text" | "Integer" | "Decimal" | "Boolean";
  unit: string | null;
  value: string | null;
  previousValue: string | null;
  sortOrder: number;
};
```

Rules:

- `NagInput.nagLogId` asserts aggregate ownership.
- `NagInput.parentNagNodeId` points to the owning `NagNode`.
- `NagInput.value` must validate against `valueType` whenever it is saved.
- `null` is allowed for every `valueType`.
- `NagInput.unit` is nullable free text, not an enum.
- `NagInput.previousValue` is server-owned copy context. Client writes must not treat it as user input.

## NagInputUnitSuggestion

`NagInputUnitSuggestion` table: `nag_input_unit_suggestion`

```ts
type NagInputUnitSuggestion = {
  userId: string;
  unit: string;
};
```

Rules:

- This is a user-scoped read model/cache for unit suggestions.
- The unique key is `(userId, unit)`.
- `NagInput.unit` is the source of truth.
- The suggestion table can be rebuilt.

## NagPlan

`NagPlan` is a read model, not an aggregate root.

Current endpoint:

```text
GET /api/todays-nag-plan?communityId={id}&userId={id}&date={date}
```

`GET /api/nag-plan?...` is kept as a compatibility alias for the same read model.

Current behavior:

- Returns `202 Accepted` with `{ "status": "Preparing" }` when active/not-deactivated `Nag` rows still have `ActiveLogDueOn < requested date`.
- Returns `200 OK` with the full plan only when required server-side copy work is complete.
- Returns active/not-deactivated `Nag` records.
- Includes open `NagLog` records where `closedOn = null`.
- Includes the `NagTime`, `NagNode`, and `NagInput` data needed for the current plan.

## Writes

The client creates IDs before submitting aggregates.

Whole-aggregate writes:

```text
PUT /api/nags/{id}
PUT /api/nag-logs/{id}
```

Narrow value update:

```text
PATCH /api/nag-logs/{id}/nag-inputs
```

Rules:

- Whole `Nag` saves replace the submitted `NagTime` set atomically.
- Whole `NagLog` saves replace the submitted node/input tree atomically.
- Narrow input updates may update `NagInput.value` only.
- Narrow input updates must validate that every input belongs to the route `NagLog`.
- Narrow input updates are rejected with `409 Conflict` when the `NagLog` is closed.
- Successful writes increment the relevant aggregate root `version`.

## Copy Behavior

There are no separate templates.

The first `NagLog` is created manually. Later `NagLog` records are copied from the previous relevant `NagLog`.

Worker copy behavior:

1. Find a lapsed active `Nag` where `activeLogDueOn < today`.
2. Require an open `NagLog`.
3. Require `NagLog.updatedAt + copyGracePeriod < now`.
4. Lock the `Nag` row and verify `activeLogDueOn` still matches the expected value.
5. Close the old open `NagLog`.
6. Calculate the next `activeLogDueOn` from `NagTime`.
7. Create a new `NagLog` copy when a future date exists.
8. Copy `NagNode` and `NagInput` rows with new IDs.
9. Move old `NagInput.value` into new `NagInput.previousValue`, and set new `value = null`.

Copy result statuses:

- `Copied`
- `Stale`
- `NoFutureOccurrence`
- `NoOpenLog`

## Database Naming

Current table names are singular snake_case:

```text
Nag                    -> nag
NagTime                -> nag_time
NagLog                 -> nag_log
NagNode                -> nag_node
NagInput               -> nag_input
NagInputUnitSuggestion -> nag_input_unit_suggestion
```

Column names use snake_case. C# properties use PascalCase. JSON properties use camelCase.

## Future Notes

These concepts are intentionally not part of the current schema.

`NagCategory` is planned as a future grouping concept. It should preserve the product idea that a category can share rules/defaults across many nags. Important example: a birthday category may later define a shared rule such as "surface/remind 7 days before" so the user has time to buy a gift. The exact rule model is not decided.

`NagLocation` is planned for location-based nagging. Existing product notes mention saved places, arrival/departure matching, app-open location refresh, manual refresh, platform geofence events, and avoiding constant GPS polling. The exact data shape is not decided.
