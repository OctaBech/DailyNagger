# ADR 0011: Decorated Context And Scoped Service Proxy

## Status

Accepted

## Context

DailyNagger actions already run through a command boundary. The boundary builds
an action scope and injects capabilities such as `memory`, `sending`,
`interactionStamp`, and `cultureSettings`.

That scope is important because a user action can start at a small domain object
but later persist a larger aggregate. For example, checking a task item starts
as:

```txt
task-item:<taskItemId>@task-log:<taskLogId>/done
```

but the send queue may receive the owning task log because the server endpoint
accepts a full task log update.

If observability is added only at the send queue, the original cause is lost.
The queue can see `task-log:<taskLogId>`, but not that the user checked a
specific task item.

We need causal traceability across:

```txt
command boundary -> action -> memory -> persistent send queue -> API -> server
```

without turning action code into telemetry plumbing.

We considered:

- passing trace metadata explicitly through every action and queue call
- ambient command context, such as `AsyncLocalStorage`-style propagation
- rewriting actions so they return pure intent objects
- refactoring command arguments to stable target tokens immediately

Explicit metadata is easy to reason about, but noisy and easy to forget.
Ambient context is attractive, but React Native is not a good place to rely on
Node-style async context propagation. Intent-returning actions and target tokens
are good long-term directions, but they are larger architecture changes.

## Decision

DailyNagger will preserve command causality by using decorated action scopes,
also known as scoped service proxies.

At command dispatch time, the command boundary may compute a stable
`commandTraceKey` from the command kind and command arguments. It may then wrap
the injected capabilities before calling the action:

- `memory` can be decorated so memory operations record the active
  `commandTraceKey`
- `sending` can be decorated so queued parcels are stamped with the active
  `commandTraceKey`

Actions should keep using the same scope shape:

```ts
memory.write.setTree(...)
sending.queue(taskLog)
```

They should not receive observability parameters only to pass them onward.

The decorator must not change business behavior. It may attach trace metadata
and create observability spans. It must not change payloads, endpoint selection,
versioning, coalescing, retry behavior, or error handling.

`commandTraceKey` is DailyNagger's stable causal identity for the domain object
or command surface that started the operation. It is not the same as Sentry or
OpenTelemetry `traceId`, and it is not an HTTP `requestId`.

The preferred key format is compact and readable:

```txt
nagger:<naggerId>
nagger:<naggerId>/schedule-rules
task-log:<taskLogId>
task-item:<taskItemId>@task-log:<taskLogId>/done
task-entry:<taskEntryId>@task-log:<taskLogId>/value
```

The key format uses:

- `:` for type and id
- `@` for owning or containing context
- `/` for command surface or field

The command surface should reuse the command boundary name where possible. A
trace key should be searchable back into the codebase without requiring a hidden
translation table between telemetry names and command names.

## Consequences

Command causality can be preserved without passing telemetry arguments through
every action.

The pattern uses normal TypeScript closures and dependency injection. It does
not depend on React Native supporting reliable async-local context.

The send queue can persist `commandTraceKey` with parcel metadata. That keeps
the causal identity available after debounce, backoff, app restart, and offline
retries.

The pattern has some hidden-wrapper risk. To keep it understandable, decorated
capabilities must stay narrow and transparent. They may add metadata; they must
not change the meaning of the capability.

Stable command target tokens remain a useful future direction. When command
arguments move from stale model nodes to stable tokens, `commandTraceKey` should
be built from those tokens instead of from full model objects.
