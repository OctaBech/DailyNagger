# ADR 0018: Client Observability Events And Middleware

## Status

Accepted

## Context

DailyNagger needs traceability so individual actions and causality chains can be
followed through their full lifetime as waterfall spans.

When a failure happens, the trace should show the domino effect from user
intent, through local state, queued work, API requests, and later handling.

We want the code to stay readable, testable, and explainable.

That means DailyNagger also needs client observability without spreading Sentry
code through normal app code.

Different boundaries need different extension styles:

- some flows run a piece of work that can be wrapped
- some boundaries only report that something happened
- some flows pause as queued work and continue later

For queued work, this means observability must support hibernating trace context
and awakening it when the work continues.

The observability model must support these requirements:

- a reader can see where a domain action starts
- a reader can see where important facts are emitted inside a function, hook, or component
- subscribers can enrich the current trace without the feature code knowing who listens
- feature code is not coupled to Sentry
- Sentry can be replaced without rewriting domain actions, API calls, memory, or sending
- queued work can hibernate trace context and awaken it later when the work is sent
- observability code must not hide business decisions or create a second domain model
- API error text must be safe before it reaches logs or observability

## Decision

Client observability follows the app boundaries instead of one shared recorder
pattern.

To make domain actions visible through their lifetime, execution boundaries use
middleware when there is a clear operation to wrap:

- action execution
- startup
- rollover
- user mood selection

The call site must show the causality key directly, so a reader can see where a
trace begins:

```ts
runWithMiddleware(
  `user-mood/select:${mood}:${new Date().toISOString()}`,
  run,
  middlewareWrapperFunction,
  { mood },
);
```

To make important facts visible inside functions, hooks, and components,
reporting boundaries emit events when they are describing something that already
happened:

- API requests
- memory writes
- sending queue flow
- app error boundary catches

To keep feature code independent from Sentry, observability subscribers listen
to those events and translate them to Sentry breadcrumbs, span attributes,
captured errors, and span continuation.

Sentry-specific code belongs under `observability/sentry`. App code may emit
events or accept middleware, but it must not call Sentry directly. Replacing
Sentry should mean replacing subscribers and Sentry helpers, not rewriting
domain actions, API calls, memory, or sending.

To support queued work, sending may hibernate trace context with queued parcels
and awaken it when the parcel batch is sent. The parcel model itself should stay
free of Sentry concepts.

To keep observability from becoming business logic, metadata is added only when
a real subscriber needs it. Business decisions still belong in the feature or
service that makes the decision.

API request scrubbing stays inside the API boundary. Observability records the
scrubbed result; it does not make raw API errors safe.

## Consequences

Feature code remains mostly ordinary app code:

```text
create data
write memory
queue parcel
emit what happened
```

Observability is added from the outside:

```text
event or middleware point
  -> observability subscriber
    -> Sentry helper
```

This keeps Sentry replaceable, keeps tests closer to app behavior, and prevents
observability data from becoming hidden business logic.

When adding observability:

1. Use middleware if the code is running a wrap-worthy operation.
2. Use events if the code is reporting a completed fact.
3. Add metadata only when a real subscriber needs it.
4. Keep event names and breadcrumb messages aligned.
5. Keep Sentry imports out of feature and service code.
