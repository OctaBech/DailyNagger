# ADR 0003: Plan Screen And Editor Boundary

## Status

Accepted

## Context

DailyNagger is meant to reduce mental load. The plan screen should help the user
act on what matters now, then leave again.

That breaks down if the plan screen also becomes the place for every structural
task operation. Move, delete, deep child creation, schedule rules, value type
setup, and rollover behavior all require the user to think about the task model
instead of just doing the current work.

The editor exists because changing the shape of the work is a different mode
than doing the work.

## Decision

The plan screen is for doing the work.

The editor is for changing the shape of the work.

The plan screen may support simple local additions when the target is obvious,
such as adding a log-root item or note to the current log. It should not become a
general structure editor.

The editor owns structural changes:

- move nodes
- delete nodes
- build nested structure
- change schedules
- change value types
- change rollover behavior

The editor must still show the same task tree reality as the plan screen. It is
an editing layer over the same model, not a different visual truth.

## Consequences

If an action needs explanation before the user can predict where it applies, it
probably belongs in the editor.

Plan-screen actions should stay beginner-friendly and predictable. Editor
actions can be more explicit because the user went there to change structure.

Selection lanes are the shared visual handle for both screens. They show where a
command will apply without forcing the user to keep the tree structure in their
head. See [ADR 0002: Selection Lanes](0002-selection-lanes.md).
