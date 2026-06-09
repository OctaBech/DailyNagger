# DDD Naming And Data Structure

This document records the authoritative domain naming and data-structure rules for DailyNagger.

It is the preferred startup context for new chats before changing domain code. The current core model is `Nag`, `NagTime`, `NagLog`, `NagNode`, and `NagInput`.

DailyNagger does not use `Task`, `TaskSeries`, or a task-table model. Older task-oriented terms in other documents are legacy wording and should be cleaned up instead of copied into new code or docs.

## Core Names

Use these names in new DDD-oriented design discussions and implementation work:

| DDD role | Name | Meaning |
| --- | --- | --- |
| Aggregate Root | `Nag` | The plan or recurring thing the user wants to perform, for example `Gym - Push day`. |
| Child Entity under `Nag` | `NagTime` | A time-based rule for when a `Nag` should become relevant, for example every Monday or every Tuesday. |
| Aggregate Root | `NagLog` | A concrete copy of a `Nag` for a specific date/run. It holds metadata for that specific copied occurrence. |
| Child Entity under `NagLog` | `NagNode` | A node in the concrete log tree, for example `Bench press` or `Triceps`. |
| Child Entity under `NagNode` | `NagInput` | A concrete user input/value for a node, for example kg, reps, checkbox, text, or note. |

`NagCategory` and `NagLocation` are planned future concepts, but they are not part of the current authoritative core model yet. Keep future notes about them separate from the current schema until their behavior and relationships are decided.

Do not use `NagContext` for this model. The old context idea mixed grouping with execution rules.

Do not use `NagOccurrence`/`NagOccurance` as the rule name. An occurrence is the concrete generated/logged instance, and that role is covered by `NagLog`.

## Aggregate Boundaries

`Nag` and `NagLog` are separate aggregate roots.

`Nag` owns the time rules that decide when a new log can be created:

```text
Nag
|- 0..n NagTime
```

`NagLog` owns the concrete node/input tree for one copied date/run:

```text
NagLog
|- 1..n NagNode
   |- 0..n NagNode
   |- 0..n NagInput
```

Aggregate roots may refer to other aggregate roots by ID. A `NagLog` should hold a `nagId` reference to the `Nag` it was copied/generated for.

Do not model `Nag` with a live mutable `NagLog[]` collection in the domain object. Use queries/read models when the UI needs to show logs for a nag.

## Client-Created Aggregate IDs

The client creates aggregate instances and assigns their IDs.

This applies to aggregate roots such as `Nag` and `NagLog`, and to child entities created inside an aggregate such as `NagTime`, `NagNode`, and `NagInput`.

Reasoning:

- The client can create a whole aggregate graph before the first save.
- Nested child entities can be referenced immediately inside the client-side JSON.
- The backend does not need to round-trip for IDs before the user can continue editing.

The backend must still validate that submitted IDs are well-formed, unique where required, and belong to the correct aggregate/community.

## Whole-Aggregate Atomic Saves

When the client edits an aggregate, it submits the whole aggregate JSON to the backend.

For the agreed model, this is especially important for:

- `Nag`, including its `NagTime` rules.
- `NagLog`, including its full `NagNode` tree and all `NagInput` records.

The backend treats the save as one atomic operation: validate the full aggregate, persist it in one transaction, or reject the whole request. Do not persist a half-updated aggregate.

This matches the DDD aggregate boundary. Partial endpoints can exist later for carefully chosen workflows, but the default write model should be whole-aggregate submit.

Exception for high-frequency input entry:

- Small commands may update only `NagInput.value` records for an existing `NagLog`.
- These commands must still go through the `NagLog` API surface.
- Backend must validate that every `NagInput` belongs to the requested `NagLog` before updating anything.
- Backend must reject `NagInput.value` updates when `NagLog.closedOn` is not null. Return `409 Conflict`, because the client queue is stale relative to server lifecycle state.
- These commands must not change tree structure, labels, descriptions, value types, or units.
- Structural edits still use whole-aggregate `NagLog` submit.

## Optimistic Concurrency

Use optimistic concurrency on aggregate roots.

- The client may later keep a local queue of small changes/edits so user actions are not lost when sync fails.
- The queue can send changes in client order instead of sending every keystroke immediately.
- Backend changes should still be applied through the aggregate root, for example `NagLog`.
- Aggregate roots such as `Nag` and `NagLog` should have a monotonic integer `version` counter.
- Prefer an explicit integer counter over SQL Server `rowversion` for this project. It is easier to read, test, debug, serialize in JSON, and keep database-portable.
- Writes include an `expectedVersion` so the backend can detect conflicts when two clients edit the same aggregate.
- The server owns the version. The client only stores the latest returned version and sends it as `expectedVersion` with the next write.
- Queue entries should not store version as their own truth. At send time, the client attaches the current known aggregate version.
- On successful write, the backend increments the aggregate root version and returns the new version.
- If the guarded version update affects `0` rows, return `409 Conflict`.
- If the client detects corruption, version conflict, unknown server state, or an external change notification, it should flush/send its update queue in order and then fetch the full `NagPlan` for the relevant date as recovery.

Implemented aggregate versions:

- `Nag.version` protects whole-aggregate `Nag` saves such as `isDeactivated` and `NagTime` changes.
- `NagLog.version` protects both whole-log saves and narrow `NagInput.value` updates.

For `NagLog`, both write paths increment `NagLog.version`:

- `PUT /api/nag-logs/{id}` whole-aggregate save.
- `PATCH /api/nag-logs/{id}/nag-inputs` narrow value update.

Both write paths must return the new server-owned version. The client stores that returned value and uses it as the next `expectedVersion`.

`PUT /api/nags/{id}` returns the full `NagDto` with the new `Nag.version`. Server-owned worker updates to `Nag.activeLogDueOn` also increment `Nag.version`.

The worker copy flow creates a new `NagLog` with `version = 0`. Closing the old log through the worker is server-owned lifecycle work and does not use a client `expectedVersion`.
- Do not merge partial server reads into the local tree during recovery. Replace the local plan with the full server plan.
- If SignalR is introduced later, use a thin notification named `NagPlanUpdated { date }`. The payload should not include the plan.
- On date change, the client should not generate the next plan itself. It can wait until the server/worker publishes `NagPlanUpdated { date }`, then fetch the full `NagPlan`.
- If `NagPlanUpdated { date }` arrives while the client has unsent queued updates, the client can ignore that notification, send its queued updates first, and then wait for a new `NagPlanUpdated { date }`.
- Queued updates may cause the server/worker to discard and regenerate the newly prepared plan so the fetched `NagPlan` reflects the submitted client changes.

This is parked for later. The current documentation should not expand this into a detailed sync protocol.

## NagPlan Read Model

`NagPlan` is the preferred read-model/API name for returning a complete plan for a date.

It is not a new aggregate root. It is a read model assembled from existing domain objects:

```text
NagPlan
  date
  Nag[]
    NagTime[]
    NagLog
      NagNode[]
        NagInput[]
```

Use `NagPlan` instead of `Snapshot` as the project name. `Snapshot` describes the technical read behavior, but `NagPlan` is clearer domain language and can be reused for history.

Current first API:

```text
GET /api/todays-nag-plan?communityId={id}&userId={id}&date=2026-06-05
```

`GET /api/nag-plan?...` can remain as a compatibility alias for the same read model.

Rules:

- The client should normally fetch the full `NagPlan` when the app opens or when the day's plan becomes current.
- The client should receive all relevant active/not-deactivated `Nag` records and their relevant `NagLog` for the requested date.
- The first implementation returns active `Nag` records where `Nag.isDeactivated = false` and open logs where `NagLog.closedOn is null`.
- The endpoint must not return a full plan as ready while active/not-deactivated `Nag` rows still have `ActiveLogDueOn < requested date`. That means the worker has not finished required copy work.
- If required copy work is still pending, return `202 Accepted` with a small body such as `{ "status": "Preparing" }` instead of returning a partial/stale plan.
- Return `200 OK` with the full `NagPlan` only when no active `Nag` is lapsed for the requested date.
- `ActiveLogDueOn = DateOnly.MaxValue` is persistent/open-ended and counts as ready. `ActiveLogDueOn = null` is a schedule problem that should be surfaced separately, not treated as lapsed work.
- Later, the same read model can support historical dates by returning the log relevant for that date.
- The client should treat the returned `NagPlan` as local truth until the next full plan fetch or recovery.
- Date changes should be server-led: server/worker prepares the plan, then publishes `NagPlanUpdated { date }`; the client fetches the full `NagPlan` after that notification.
- Avoid endpoints whose normal workflow is fetching and merging one `NagLog` at a time; that increases client merge complexity and corruption risk.

## NagPlan Readiness And Notifications

Future worker infrastructure should keep plan readiness separate from notification delivery.

Planned infrastructure tables:

```text
nag_plan_status
  user_id
  date
  status        // Preparing, Ready, Notified
  ready_at
  notify_after
  notified_at

notification_outbox
  id
  user_id
  notification_type // NagPlanUpdated
  date
  payload_json      // thin payload, for example { "date": "2026-06-05" }
  status            // Pending, Retry, Sent, Failed
  retry_count
  next_attempt_at
  sent_at
  sent_by
```

Rules:

- `nag_plan_status` answers whether a user's plan for a date is being prepared, ready, or already notified.
- `notification_outbox` answers which SignalR hints still need delivery/retry/audit.
- Do not enqueue `NagPlanUpdated { date }` until required server-side plan generation/copying is complete for that user/date.
- Users with no logs to copy should still get a `nag_plan_status` transition to `Ready`, so they can also receive `NagPlanUpdated { date }`.
- `notify_after` may be jittered/throttled so all clients do not request `NagPlan` at the same instant.
- SignalR workers should send only pending/retry `notification_outbox` rows whose readiness/throttle time allows delivery.
- A successful `GET /api/todays-nag-plan` for `userId + date` should mark matching pending/retry `NagPlanUpdated` notifications as `Sent`, not delete them.
- When a plan fetch consumes a pending notification, set `sent_by = "NagPlanFetch"` and `sent_at = now` to preserve history and prevent a stale SignalR notification.
- SignalR remains a hint. The source of truth is still the full `NagPlan` fetched from the API.

## Copy Rule

There are no separate templates for nodes or inputs.

The first `NagLog` is created manually by the user. No `isSeed` flag is needed.

Every later `NagLog` for the same `Nag` is created by copying the previous relevant `NagLog`.

This is intentional because changes made on the day or during the run should roll forward:

- Current node structure rolls forward.
- Current input setup rolls forward.
- Current default values such as kg and reps roll forward.
- User changes made in the latest log become the source for the next log.

`NagLog` should therefore support copy lineage:

```text
NagLog
  id
  nagId
  copiedFromNagLogId nullable
  closedOn nullable
```

`NagLog.closedOn` records when the concrete log was finished/submitted. An open active log has `closedOn = null`.

## Active Log Deadline

`Nag.ActiveLogDueOn` is the finish-by date for the active open `NagLog`, not the date of a future uncreated occurrence.

`Nag.ActiveLogDueOn` value meanings:

- A real date means the active open `NagLog` has a finish-by deadline. The worker may copy it after that date is exceeded.
- `DateOnly.MaxValue` means the `Nag` is persistent/open-ended because there are no `NagTime` rules. This is valid and should not be highlighted as a problem.
- `null` means the schedule chain has a problem and no next deadline could be calculated. The client should highlight the `Nag` so the user can either add `NagTime` rules or deactivate the `Nag`.

An empty `Nag.NagTimes` collection is valid. The occurrence calculator must return `DateOnly.MaxValue` for active nags with no time rules.

`isDeactivated` must not be set by the copy worker just because the next date cannot be calculated. Deactivation is an explicit user/API action.

The user may complete the active `NagLog` before that date. The worker should only create the next `NagLog` when the active log's finish-by date has been exceeded.

When the worker creates the next log, it copies the previous relevant `NagLog`, calculates the new finish-by date from `NagTime`, and stores that date on `Nag`.

Copy grace protects already-queued client writes around date changes. This is a data-consistency rule, not a UX plan-readiness rule.

`NagLog.updatedAt` is server-owned UTC time. Both whole-log saves and narrow `NagInput.value` updates must update it. The client must not send `updatedAt` as truth.

`NagLog.updatedAt` must be required in the database and must never be the default/min value. `DateTimeOffset.MinValue` is invalid persisted state, because copy grace needs a real server write time.

The copy worker may copy a lapsed `Nag` only when:

```text
NagLog.updatedAt + gracePeriod < now
```

The grace period is configured as `NagCopyWorker:CopyGracePeriod`. The delegator loop reads it from `IOptionsMonitor<NagCopyWorkerOptions>` on every loop iteration so local config changes can be picked up without restart where the configuration provider supports reload.

The grace period gives the client's existing update queue time to reach the server after the deadline. It should not decide whether the client clears/refetches the screen.

The first worker read is `GetLapsedNagAsync(communityId, today, now, copyGracePeriod)`. It returns only lightweight `LapsedNag` items:

```text
LapsedNag
|- nagId
|- activeLogDueOn
```

The query rule is:

```sql
where nag.is_deactivated = 0
  and nag.active_log_due_on is not null
  and nag.active_log_due_on < @today
  and nag_log.closed_on is null
  and nag_log.updated_at < @now - @copyGracePeriod
```

`activeLogDueOn = today` is not lapsed. It becomes lapsed the next day if the active log is still open.

The first worker write is `CopyLapsedNagLogAsync(communityId, nagId, expectedActiveLogDueOn, today, closedOn)`.

It is an atomic command:

```text
begin transaction
|- lock Nag where activeLogDueOn still equals expectedActiveLogDueOn
|- if no row matches: rollback and return stale/no-op
|- calculate the next activeLogDueOn from NagTime
|- close the old open NagLog
|- create a new NagLog with a new id and copiedFromNagLogId = old NagLog id
|- copy NagNode rows with new ids and remapped parentNagNodeId values
|- copy NagInput rows with new ids and remapped parentNagNodeId values
|- update Nag.activeLogDueOn
commit
```

Worker copy result meanings:

- `Copied`: a new `NagLog` was created and `Nag.ActiveLogDueOn` was moved to the next calculated date.
- `Stale`: the expected deadline no longer matches the database row, usually because another worker or edit already changed the `Nag`; this is not a failure.
- `NoFutureOccurrence`: the old `NagLog` was closed, no new `NagLog` was created, and `Nag.ActiveLogDueOn` was set to `null` because no next deadline could be calculated.
- `NoOpenLog`: the `Nag` is lapsed but has no open `NagLog` to copy. Treat this as an integrity problem for logging/diagnostics.
- `Failed`: a technical exception escaped the copy command. The worker wrapper catches/logs this; it should not be represented as a normal domain result.

The result should include `status`, `nagId`, nullable `oldNagLogId`, nullable `newNagLogId`, and nullable `activeLogDueOn`.

Worker wrappers should use structured logs with named fields such as `NagId`, `OldNagLogId`, `NewNagLogId`, `OldActiveLogDueOn`, `NewActiveLogDueOn`, and `ExpectedActiveLogDueOn`.

Worker observability should start with a Control DB `nag_log_copy_delegator_status` snapshot table.

Rules:

- The table represents per-community `NagCopyDelegatorLoop` status.
- Use `delegatorId`, stable `delegatorName`, and nullable `communityId`.
- Do not report `CommunityLapsedNagLogReconciler` here yet; structured logs are enough for it.
- `status` is a string enum: `Starting`, `Running`, `Stopping`, `Stopped`, `Failed`.
- Lifecycle timestamps include `startedAt`, `lastSeenAt`, `stoppedAt`, and optional `lastErrorAt`.
- For NagLog copying, write one status snapshot per delegator run, not per copied NagLog.
- Run fields include `lastRunStartedAt`, `lastRunFinishedAt`, `lastRunDurationMs`, and `lastRunMaxParallelism`.
- Counters include `totalRunCount`, `totalCopiedCount`, `totalStaleCount`, `totalNoFutureOccurrenceCount`, `totalNoOpenLogCount`, `totalErrorCount`, and `errorCountSinceLastSnapshot`.
- Duration metrics are app-server level: `totalDbDurationMs`, `totalProcessingDurationMs`, `maxDbDurationMs`, `maxProcessingDurationMs`, `lastDbDurationMs`, and `lastProcessingDurationMs`.
- `dbDuration` is elapsed time around DB read/write calls from the app's perspective. Do not try to replace SQL Server tooling inside application code.
- `processingDuration` is application work between DB calls, such as validation, tree traversal, copy/remap, and mapping.
- Use these metrics to decide whether to adjust `maxParallelCopyWorkers` or isolate CPU-heavy tree work with `Task.Run` later.
- NagLog copy delegator status writes are best-effort. If status writing fails, log a warning and continue the delegator loop/domain command.

The old and new logs must not share `NagNode` or `NagInput` ids. Statistics should use later dimension tags/read models instead of shared entity ids across log copies.

Copy rules for the `NagLog` tree:

- Every copied `NagLog`, `NagNode`, and `NagInput` gets a new GUID.
- `NagLog.copiedFromNagLogId` links the new log to the old log.
- `NagNode.parentNagNodeId` must be remapped from old node ids to new node ids during traversal.
- `NagInput.parentNagNodeId` must point to the copied parent node id.
- Do not "deactivate" copied nodes or inputs. Closing the old `NagLog` makes the whole old tree historical.
- Later statistics should use dimension tags/read models instead of shared entity ids across log copies.

Concurrency and write rules:

- The worker write must be one transaction.
- The first operation inside the transaction must lock the `Nag` row and verify `activeLogDueOn = expectedActiveLogDueOn`.
- If the guarded row check affects or returns `0` rows, the command is stale and must no-op or roll back without copying.
- The old `NagLog.closedOn`, new `NagLog`, copied nodes/inputs, and `Nag.activeLogDueOn` update must commit or fail together.
- The delegator may dispatch duplicate work. The worker transaction is the source of truth that prevents duplicate copies.

Future timezone/day-boundary rules:

- Timezone/day-boundary belongs to user settings.
- It applies to all of the user's `Nag` records.
- Do not configure day-boundary per `Nag`; that would make worker behavior and UX too hard to predict.
- Example future fields: `timeZoneId` and `dayBoundaryTime`.
- This is parked until the client/user settings model exists.

Delegator/worker-wrapper rules:

- Delegator owns scheduling, lapsed-list reads, and the configured maximum number of parallel copy workers.
- The first delegator implementation should be a testable `RunOnceAsync` class using delegates as TDD seams for "get lapsed nags" and "run worker".
- `NagCopyDelegatorLoop` owns polling around `RunOnceAsync`.
- `CommunityLapsedNagLogReconciler` owns multi-community reconciliation for lapsed NagLog generation. It reads active `NagCommunity` ids from Control DB and reconciles one running `NagCopyDelegatorLoop` per active community.
- Delegator polling interval is measured from the start of a run. If work takes longer than the interval, the next run starts immediately.
- Test interval behavior with fake time and fake delay, never real-time sleeps.
- Delegator copy dispatch should use async tasks plus `SemaphoreSlim`, not `Task.Run` around the whole I/O-heavy copy workflow.
- `NagCopyWorker` runs one copy command, owns logging for copied/stale/failure outcomes, and returns a small result to the delegator.
- `NagCopyDelegator` aggregates worker results in memory and returns one run result to `NagCopyDelegatorLoop`.
- Worker wrappers must catch and log exceptions so background task failures do not disappear.
- Copy commands should not take callbacks. They return a result or throw; the wrapper decides how to report that.
- `NagCommunity.isDeactivated` belongs in Control DB. Deactivated communities must stay stored with their connection settings, but they must not be returned to `CommunityLapsedNagLogReconciler` as active work.
- Removing/deactivating a community should stop future scheduling for that community. If a `NagCopyDelegatorLoop` is already inside `RunOnceAsync`, that current run/batch should be allowed to finish. The loop must not start another run after the community has been removed/deactivated.
- Already started copy commands should be allowed to finish or roll back cleanly; do not kill in-flight domain writes just because the community list changed.
- `CommunityRefreshInterval` controls how often active communities are reconciled. It is separate from the per-community `DelegatorInterval`.

Implementation rules:

- Reuse the same tree read/write logic for API writes and worker copies where practical.
- Build batched SQL for node/input inserts instead of executing one SQL command per node/input row.
- Keep traversal/mapping in application code where it is readable; keep persistence atomic in SQL.

Do not put `dueOn` on `NagLog`. The deadline/cursor belongs on `Nag`; completion belongs on `NagLog`.

```text
Nag.ActiveLogDueOn
NagLog.closedOn
```

The active log query is:

```sql
select *
from nag_log
inner join nag on nag_log.nag_id = nag.id
where nag_log.closed_on is null
```

There should normally be one open `NagLog` per `Nag`.

## Activation Naming

Use `Nag.isDeactivated` for the off-state flag.

Reasoning:

- Default `false` means a newly created `Nag` participates in plan/worker behavior without requiring the caller to remember to set an active flag.
- `isDeactivated` describes the exceptional state: the nag has been explicitly turned off.
- Avoid slang or destructive names such as `isShushed` or `isKilled` for this domain flag. Those names can be confused with notification mute, snooze, deletion, or permanent retirement.
- If temporary silence is needed later, model it separately with a more specific concept such as `quietUntil` or `shushedUntil`.

## Source Of Truth

There must never be doubt about which object owns the truth for a domain fact.

Rules:

- A fact should have one authoritative owner.
- Other places may reference, query, or denormalize that fact only when the reason is explicit.
- If data is denormalized, document which field is authoritative and how the derived copy is refreshed.

Current ownership examples:

- `Nag.ActiveLogDueOn` owns the active log deadline/cursor.
- `NagLog.closedOn` owns whether a concrete log is finished.
- `NagTime` owns the schedule rules used to calculate future active-log deadlines.
- `NagNode.nagLogId` owns which concrete log a node belongs to.
- `NagInput.nagLogId` owns which concrete log an input belongs to.
- `NagInput.parentNagNodeId` owns which node an input is directly attached to.
- `NagInput.unit` owns the concrete input unit value.
- `NagInputUnitSuggestion` is a derived read model/cache, not source of truth.

## Data Relationships

The intended relational shape is:

```text
Nag 1:0..n NagTime
Nag 1:n NagLog

NagLog 1:n NagNode
NagNode 1:0..n NagNode
NagNode 1:0..n NagInput

NagLog copiedFrom 0:1 NagLog
```

Use a foreign key on the child side for one-to-many relationships. Do not create a mapping table for `Nag` to `NagLog`, because each `NagLog` belongs to exactly one `Nag`.

Recommended FK shape:

```text
NagTime.nagId
NagLog.nagId
NagLog.copiedFromNagLogId
NagNode.nagLogId
NagNode.parentNagNodeId
NagInput.nagLogId
NagInput.parentNagNodeId
```

`NagNode` is a self-referencing tree. Every node should still carry `nagLogId`, including child nodes, so the aggregate can be loaded efficiently and parent-child consistency can be validated within the same log.

Foreign keys are a deliberate database-level integrity guarantee, not just documentation. App validation gives user-friendly `400 Bad Request` errors, but the database should still reject impossible relationships if application code has a bug.

Current intended FK guarantees include:

- `nag_log.nag_id -> nag.id`
- `nag_time.nag_id -> nag.id`
- `nag_node.nag_log_id -> nag_log.id`
- `nag_node.parent_nag_node_id -> nag_node.id`
- `nag_input.nag_log_id -> nag_log.id`
- `nag_input.parent_nag_node_id -> nag_node.id`

Indexes should be sparse and access-pattern driven. Add indexes where code joins, filters, validates ownership, deletes by relationship, or worker queries require them. Do not add indexes to every column by default.

Current baseline indexes should cover FK/query fields such as `nag_log.nag_id`, `nag_node.nag_log_id`, `nag_node.parent_nag_node_id`, `nag_input.nag_log_id`, and `nag_input.parent_nag_node_id`. Add future worker indexes, such as `nag(is_deactivated, active_log_due_on)`, when the worker read query is implemented.

## NagLog Tree Ownership And API Assertions

`NagNode.name` is the display name for the node in the concrete log tree, for example `Bench press`, `Set 1`, or `Triceps`.

Do not use `NagNode.title`. `Title` is kept for `Nag.title`; node naming should stay `Name` / `name` / `name` across C#, JSON, and database.

`NagNode` and `NagInput` should both carry `nagLogId`.

This is intentional aggregate ownership data, not competing tree structure data.

```text
NagNode.nagLogId
NagInput.nagLogId
```

`NagNode.parentNagNodeId` and `NagInput.parentNagNodeId` describe immediate parent structure:

```text
NagNode.parentNagNodeId nullable
NagInput.parentNagNodeId
```

Reasons:

- Indexing: queries and updates can target all nodes/inputs for a log without recursive traversal.
- Debug readability: rows and JSON objects show their owning `NagLog` immediately.
- Client data at hand: the client can build small `NagInput.value` update commands without walking back up the tree to find the log id.
- SQL updates: value updates can validate `nagLogId` directly and cheaply.
- SQL deletion: replacing a log tree can delete inputs by `nagLogId` before deleting nodes.
- PX/DX: the browser/client payload is easier to inspect because ownership and parent information are visible on each record.

For nested API payloads, nesting is the source of truth for tree placement, while the ID fields are consistency assertions.

Backend validation rules:

```text
NagNode.nagLogId == route/request NagLog.id
NagNode.parentNagNodeId == containing parent NagNode.id, or null for root nodes
NagInput.nagLogId == route/request NagLog.id
NagInput.parentNagNodeId == containing NagNode.id
```

If an assertion field disagrees with the nested position, reject the request with `400 Bad Request`. Do not silently repair client tree corruption.

`NagInput` belongs to one `NagNode` and should use this shape:

```text
NagInput
  id
  nagLogId
  parentNagNodeId
  label
  description nullable
  valueType
  unit nullable
  value nullable
  previousValue nullable
  sortOrder
```

`valueType` is an enum used by the UI/backend to parse and render the value:

```text
Text
Integer
Decimal
Boolean
```

`NagInput.value` must validate against `valueType` on both whole `NagLog` saves and narrow `NagInput.value` update commands:

- `Text` accepts any string.
- `Integer` must parse as an integer.
- `Decimal` must parse as a decimal.
- `Boolean` must parse as `true` or `false`.
- `null` is allowed for any `valueType`.

`NagInput.previousValue` is server-owned copy context. When the worker copies a `NagLog`, it should move the old `NagInput.value` into the new `NagInput.previousValue` and set the new `NagInput.value` to `null`.

Rules:

- `value` is the current concrete input for this `NagLog`.
- `previousValue` is display/reference context from the copied-from log, for example grey placeholder text in the client.
- `previousValue` must not count as submitted/current input.
- Client/API write requests must not own `previousValue`; reject or ignore it rather than treating it as user input.
- Validate at the trust boundary: user-submitted `value` is validated against `valueType`. Worker-created `previousValue` does not need duplicate validation because it comes from an already validated server-owned `value`.

`unit` is free text, not an enum. Examples: `kg`, `km`, `m`, `cm`, `l`, `kr`, `stk`.

## Nag Input Unit Suggestions

`NagInputUnitSuggestion` is a read model/cache for user-specific unit suggestions.

Shape:

```text
NagInputUnitSuggestion
  userId
  unit
```

Use a unique key on:

```text
userId + unit
```

Rules:

- `NagInput.unit` is the source of truth.
- `NagInputUnitSuggestion` can be rebuilt from `NagInput` data.
- Saving a `NagLog` may upsert units from submitted `NagInputs` into this read model.
- The read model is scoped by user so another user's unsuitable units do not appear as suggestions.
- A future worker may clear and rebuild this table for eventual consistency.

## Collection Property Naming

When a property contains a list of child entities, name the property after the child entity type, normally pluralized in code and JSON.

Use these names:

```text
Nag.NagTimes
NagLog.NagNodes
NagNode.NagInputs
```

Avoid semantic aliases such as `Times`, `Rules`, `Nodes`, or `Inputs` when the property represents concrete domain entities. This keeps DTOs, JSON, tests, and domain code aligned with the DDD names.

Example JSON:

```json
{
  "id": "client-created-nag-id",
  "title": "Gym - Push day",
  "nagTimes": [
    {
      "id": "client-created-nag-time-id",
      "timeType": "weekly",
      "dayOfWeek": "monday"
    }
  ]
}
```

## Value Object Naming

Value object names must stay consistent all the way through the stack.

Use the same domain concept name for:

- C# property names.
- JSON field names.
- Database column names.
- API endpoint and route segment names when the value object appears directly in the API surface.
- Test names and documentation.

Convert only casing/style for the target layer:

```text
Value object: ClosedOn
C# property: ClosedOn
JSON field: closedOn
DB column: closed_on
API route segment, if needed: closed-on
```

Do not introduce a different semantic alias for the same value object in another layer.

There are no lists of value objects in the agreed model. Lists/collections should be entities only.

## Database Naming

Database table names should match entity names directly, converted from PascalCase to snake_case.

Use singular table names. Do not pluralize tables.

Examples:

| Entity | Table |
| --- | --- |
| `Nag` | `nag` |
| `NagTime` | `nag_time` |
| `NagLog` | `nag_log` |
| `NagNode` | `nag_node` |
| `NagInput` | `nag_input` |

Column names should also use snake_case in the database. Domain code can keep idiomatic PascalCase property names.

## Example

Master/plan:

```text
Nag: "Gym - Push day"
|- NagTime: every Monday
|- NagTime: every Tuesday
```

Concrete log for one date:

```text
NagLog
  nagId: "Gym - Push day"
  copiedFromNagLogId: previous push-day log
  date metadata: specific date/run

|- NagNode: "Bench press"
|  |- NagInput: kg
|  |- NagInput: reps
|- NagNode: "Triceps"
   |- NagInput: kg
   |- NagInput: reps
```

## Naming Preference

Prefer short domain names:

- Use `NagTime`, not `NagTemporalCondition`, unless the code needs the more formal name.
- Use `NagLog` for the concrete occurrence/copy.
- Use `NagNode` for the log-owned tree structure.
- Use `NagInput` for concrete user input.

Avoid `Template` names for this model. The previous `NagLog`, not a separate template entity, is the source of the next copy.

`NagLog` is still the preferred name for now. `NagTask` would conflict with task/node language, and `NagObjective` sounds like the goal rather than the concrete dated execution record. If `NagLog` starts to feel too historical for an active unfinished copy, the strongest alternative is `NagRun`, but do not rename it until the aggregate is implemented.
