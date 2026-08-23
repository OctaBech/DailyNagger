# ADR 0010: Persistent Send Queue

## Status

Accepted

## Context

DailyNagger is most useful when checking off work feels immediate. A user should
not wait for the server before the screen updates.

The mobile app also has to survive ordinary mobile conditions: weak signal,
closed app, restarted app, delayed server response, and repeated edits to the
same nagger or task log.

We considered a small local database for queued sends. The queue does not need
query joins, relational constraints, or historical reporting. It needs a small,
ordered, durable list of pending delivery work.

## Decision

DailyNagger uses a persistent client-side send queue backed by MMKV.

The app updates local state first. Shared server updates are converted into
queued parcels. Each parcel contains:

- a `formula`, describing what should be sent and where
- a `stamp`, describing when and by which client/device the parcel was queued
- a `parcelId`, used for traceability and visual feedback

The queue owns delivery behavior:

- persist unsent parcels across app restarts
- debounce quick edits before sending
- coalesce newer updates over older updates when they target the same safe
  owner/key
- batch compatible parcels for the same owner and type
- use version stamps when the server expects versioning
- back off after connection failures
- stop and ask the user when the server reports a version conflict that needs a
  decision

The postal strip is part of the same decision. Sending is not hidden background
magic. Queue events are visualized so the user can see work being queued, sent,
blocked, forced, discarded, or waiting for connection.

## Consequences

Screens and actions should queue shared changes instead of calling the server
directly.

The server remains authoritative for accepted persisted state, but the client is
allowed to be optimistic and useful while disconnected.

MMKV is a deliberate storage choice for this queue. If the queue later needs
querying, migrations, or audit history, that should be a new decision, not a
quiet replacement.

Queue schema changes must be handled deliberately. Invalid persisted queues may
be discarded during development, but compatible production changes need an
explicit migration or discard strategy.

Observability should treat the send queue as a first-class boundary. `parcelId`,
`queuedAt`, version fields, client identity, and send result events are part of
understanding what happened.
