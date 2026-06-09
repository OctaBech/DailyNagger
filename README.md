# DailyNagger

DailyNagger is a to-do app that stays on the user's back until a task has been done or has become lapsed.

For each task the user wants to be reminded about, they create a `Nag`.

A `Nag` can have rules for where, when, and how often the task should be done.

Tasks are not all shaped the same. Some are simple reminders. Others need a checklist, measurements, notes, or repeated structured input. That working form lives in a `NagLog`.

A `NagLog` is the user's current form for doing the task. It can contain a list or tree of nodes and inputs that the user fills in while working through the task.

When a `Nag` passes its deadline, the current `NagLog` is closed and archived. DailyNagger then creates a copy of that log for the next time the nag should be done.

As the user learns more about the task, they can change the shape of the log: add or remove nodes, change what data should be entered, and adapt the workflow.

When the deadline passes, DailyNagger copies the newest structure of the log. Entered values are copied forward as previous values, so the user can easily see what they entered last time.

## Product Examples

- A gym nag can contain exercises such as squats and bench press.
- A grocery nag can contain a changing shopping list.
- A birthday nag can later belong to a category that reminds the user early enough to buy a gift.
- A weight or food nag can collect structured values over time.
- A location-related nag can later become relevant when the user is near a saved place.

## Domain Model

DailyNagger uses DDD-style aggregate roots.

It does not use `Task`, `TaskSeries`, or a task-table model.

```text
Nag
|- 0..n NagTime

Nag 1:n NagLog

NagLog
|- 1..n NagNode
   |- 0..n NagNode
   |- 0..n NagInput
```

### Nag

`Nag` is the plan/root for something the user wants to be nagged about.

It owns:

- `title`
- `nagTimes`
- `activeLogDueOn`
- `expiresOn`
- `isDeactivated`
- `version`

`Nag.activeLogDueOn` is the finish-by date for the active open `NagLog`.

`Nag.activeLogDueOn = DateOnly.MaxValue` means the nag is open-ended because it has no `NagTime` rules.

`Nag.activeLogDueOn = null` means the schedule chain has a problem and the user should fix the nag or deactivate it.

### NagTime

`NagTime` is one time rule for a `Nag`.

One rule is stored per record.

Current rule types:

- `Weekly`
- `MonthlyDay`
- `YearlyDate`

The scheduler uses `NagTime` records to calculate the next `activeLogDueOn`.

### NagLog

`NagLog` is one concrete run/copy of a `Nag`.

It owns the tree the user works in:

- `NagNode`
- `NagInput`

`NagLog.closedOn = null` means the log is open.

`NagLog.closedOn != null` means the log is historical.

`NagLog` does not own its own deadline. The deadline belongs to `Nag.activeLogDueOn`.

### NagNode

`NagNode` is a node in the log tree.

A node can be:

- a list item
- a grouping node
- a parent for child nodes
- a holder for inputs

A node may have child nodes, inputs, both, or neither.

### NagInput

`NagInput` is structured data attached to a `NagNode`.

Current value types:

- `Text`
- `Integer`
- `Decimal`
- `Boolean`

`NagInput.unit` is nullable free text, not an enum.

Examples:

- `kg`
- `reps`
- `kcal`
- `cm`
- `kr`

`NagInput.value` is the current value for this log.

`NagInput.previousValue` is copied from the previous log and shown as reference. It is not a submitted value until the user saves it as the current value.

## JSON Shape And DX

The API shape should be pleasant to work with in the client.

`NagLog` JSON is nested like the UI tree. It is not returned as a flat list that the client has to stitch together before rendering.

Example shape:

```json
{
  "id": "nag-log-id",
  "nagId": "nag-id",
  "nagNodes": [
    {
      "id": "node-id",
      "name": "Squats",
      "nagInputs": [
        {
          "id": "input-id",
          "label": "Weight",
          "valueType": "Decimal",
          "unit": "kg",
          "value": "80",
          "previousValue": "77.5"
        }
      ],
      "nagNodes": []
    }
  ]
}
```

The nested JSON is the source of truth for placement in API payloads. Ownership IDs such as `nagLogId` and `parentNagNodeId` are still included as consistency assertions.

## Reads

The client should fetch the day's full plan at once.

```text
GET /api/nag-plan?communityId={id}&userId={id}&date={date}
```

`NagPlan` is a read model, not an aggregate root.

It returns the active nags and their open logs for the requested day.

Normal client flow:

- Fetch the full `NagPlan`.
- Treat that tree as local truth for the day.
- Send writes through aggregate endpoints.
- Refetch a fresh `NagPlan` when recovering from conflict, corruption, or a later server-side day change.

## Writes

The client creates IDs before sending aggregate data to the server.

Whole-aggregate writes:

```text
PUT /api/nags/{id}
PUT /api/nag-logs/{id}
```

Rules:

- A `Nag` write saves the root and its `NagTime` rules atomically.
- A `NagLog` write saves the whole node/input tree atomically.
- The server accepts the whole aggregate or rejects the whole aggregate.
- Root aggregate writes use `expectedVersion`.
- Successful writes increment the root `version`.

When the `NagLog` structure changes, the client sends the whole structure to the server. This keeps the backend from having to splice partial tree branches together.

The only narrow update path is for `NagInput.value`:

```text
PATCH /api/nag-logs/{id}/nag-inputs
```

This endpoint may update values only. It must validate that every input belongs to the route `NagLog`. It is rejected if the `NagLog` is already closed.

## Copy Forward

There are no separate templates.

The latest open `NagLog` is the source for the next copy.

When a nag is lapsed:

1. The worker finds a `Nag` where `activeLogDueOn < today`.
2. The worker requires an open `NagLog`.
3. The worker waits until `NagLog.updatedAt + copyGracePeriod < now`.
4. The worker locks the `Nag` row and verifies the expected `activeLogDueOn`.
5. The old `NagLog` is closed.
6. The next `activeLogDueOn` is calculated from `NagTime`.
7. A new `NagLog` is created when a future date exists.
8. The `NagNode` and `NagInput` tree is copied with new IDs.
9. Old input `value` is moved into new input `previousValue`.
10. New input `value` starts as `null`.

This means the user can change the log structure over time, and the newest structure is what rolls forward.

## Future Concepts

`NagCategory` is planned as a future grouping concept.

Example: a birthday category may later define a shared rule such as surfacing birthday nags 7 days before the date, so the user has time to buy a gift.

`NagLocation` is planned for location-based nagging.

Existing product thoughts include saved places, arrival/departure matching, app-open location refresh, manual refresh, platform geofence events, and avoiding constant GPS polling.

## Technical Shape

- Backend: ASP.NET Core / C#.
- Database: SQL Server.
- Data access: EF Core migrations plus direct SQL for selected aggregate/worker operations.
- API documentation: OpenAPI.
- Client: React / TypeScript / Vite.
- Background work: hosted service for lapsed `NagLog` copy flow.

## Build And Test

Build backend and tests:

```powershell
dotnet build DailyNagger.sln
```

Run backend tests:

```powershell
dotnet test DailyNagger.sln
```

Build client:

```powershell
cd src\DailyNagger.Client
npm.cmd install
npm.cmd run build
```

Start SQL Server for local development:

```powershell
docker compose up -d sqlserver
```
