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

The practical shape should stay boring. A boundary creates one observability
context for the thing that just started. That context is then carried forward
instead of rebuilding little pieces of telemetry at every stop. Recorders should
take the context as their first argument and then the few local facts they need,
such as the memory name, parcel id, or batch id. That keeps the call sites easy
to read: "record this thing, for this context, with these details."

The context builder may use a typed object input because different causes need
different fields. A task item action, a mood selection, a startup flow, and an
error decision are not the same shape. The record functions should be simpler:
sharp parameters are preferred when there are only one or two extra values, so
IntelliSense can guide the next argument without making the caller dig through
a bag of optional properties.

Only `@/observability` should import Sentry. The rest of the app should call
DailyNagger record functions. That keeps Sentry formatting, span names,
attributes, breadcrumbs, and propagation rules in one place.

At command dispatch time, the command boundary may create an observability
context from the command kind and command arguments. That context includes the
stable causality key and any Sentry trace context that needs to survive the
persistent queue. The boundary may then wrap the injected capabilities before
calling the action:

- `memory.write` can be decorated so memory mutations record the active
  causality
- `sending` can be decorated so queued parcels are stamped with the active
  causality

Decorators should be applied only around side-effect capabilities. For memory,
`state` and `read` pass through unchanged; `write` is the meaningful boundary
because it changes application state. Recording reads would mostly create noise
and make the wrapper look more magical than it is.

Actions should keep using the same scope shape:

```ts
memory.write.setTree(...)
sending.queue(taskLog)
```

They should not receive observability parameters only to pass them onward.

Raw sending and action sending are intentionally different capabilities.
`Sending.queue` requires an observability context because every persisted
parcel must have a causal identity. `ActionSending.queue` does not expose that
parameter because the command boundary has already stamped the capability
before the action receives it.

The decorator must not change business behavior. It may attach trace metadata,
create observability spans, and add breadcrumbs that explain the user-visible
cause of later work. It must not change payloads, endpoint selection,
versioning, coalescing, retry behavior, or error handling.

Causality is DailyNagger's stable causal identity for the domain object or
command surface that started the operation. Its `key` is not the same as Sentry
or OpenTelemetry `traceId`, and it is not an HTTP `requestId`.

Causality keys are join data. Breadcrumbs are the readable story. A causality
key that only appears as a span attribute is not enough, because the developer
still has to hunt for the cause. Command, memory, and sending boundaries should
therefore record breadcrumbs with the active causality and the domain operation
that just happened.

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
causality key should be searchable back into the codebase without requiring a
hidden translation table between telemetry names and command names.

## Consequences

Command causality can be preserved without passing telemetry arguments through
every action.

The pattern uses normal TypeScript closures and dependency injection. It does
not depend on React Native supporting reliable async-local context.

The send queue persists `causalityKeys` with parcel metadata. That keeps the
causal identity available after debounce, coalescing, batching, backoff, app
restart, and offline retries.

When queued work is sent later, the queue should use the persisted
observability context instead of inventing a new explanation. Sentry can still
own the technical trace, but DailyNagger must carry the domain cause through
the queue because Sentry cannot infer it from delayed local state.

The pattern has some hidden-wrapper risk. To keep it understandable, decorated
capabilities must stay narrow and transparent. They may add metadata; they must
not change the meaning of the capability.

Stable command target tokens remain a useful future direction. When command
arguments move from stale model nodes to stable tokens, causality keys should be
built from those tokens instead of from full model objects.
