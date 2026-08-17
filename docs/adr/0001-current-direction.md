# ADR 0001: Current Direction

## Status

Accepted

## Context

DailyNagger exists to reduce mental load so the user can live in the moment.

The app should show the tasks that are relevant now. It is not meant to pull the
user into planning far ahead or reviewing past statistics to optimize a
lifestyle.

DailyNagger should be an in-and-out app: open it, see what matters now, act, and
leave.

The app should not turn the user into the project manager of their own life.

Task solutions will often change as the user learns what they actually need.
The app should make it easy to adjust routines, entries, notes, and task
structure on a whim without treating every change as a major planning session.

## Decision

DailyNagger prioritizes present-focused task guidance over long-range planning,
analytics, and lifestyle optimization.

The product should make current routines, reminders, and observations easy to
capture and act on without requiring the user to manage a large dashboard.

Automation should be polite. It may suggest, prefill, and reuse known
user-provided information, but it should not invent new truth, take control away
from the user, or hide meaningful changes. The user should be able to see,
correct, or undo what the app did on their behalf.

Task structures should remain easy to reshape as the user's understanding of the
task improves.

The editor should show the same task tree reality as the plan screen. Editing is
a tool layer on top of the current tree, not a separate visual mode with a
different meaning for card colors or completion state.

The editor has its own screen to make editing boundaries obvious to the user:
they are working on this task tree, with these allowed tools, without reaching
sideways into unrelated cards.

See [ADR 0002: Selection Lanes](0002-selection-lanes.md) and
[ADR 0003: Plan Screen And Editor Boundary](0003-plan-screen-and-editor-boundary.md)
for concrete interaction decisions that follow from this direction.

## Consequences

- Screens should prefer current relevance over complete historical context.
- Future work should not turn the main experience into a statistics dashboard.
- Historical data can exist for reference, debugging, and future assistants, but
  it should not dominate the user interface.
- Features should reduce decision load rather than create more planning work.
- Editing flows should support quick adjustment without making the user feel
  locked into yesterday's task model.
- Editor-only controls should appear as editing affordances, such as outlines,
  handles, modals, or action buttons. They should not change what the underlying
  cards appear to be.
