# ADR 0015 - Preserve Screen Position Across Plan And Editor

## Status

Accepted

## Context

DailyNagger is built around an in/out workflow: the user should be able to open
the app, adjust the current work, and leave again without losing context.

The plan screen and editor screen show the same nagger tree in different
contexts. Expanded state and selected node should carry across the transition,
but visual position matters too. If the user opens the editor while looking at a
node deep inside an expanded nagger, the editor should open in the corresponding
place instead of starting at the top.

## Decision

AppShell owns a transient scroll-position handoff for screen-to-screen UI
continuity.

PlanScreen and EditorScreen each write their own raw list measurements:

- current scroll offset
- measured nagger top position

The screen being opened converts the other screen's measurements into its own
scroll position.

## Consequences

Scroll position is treated as UI continuity, not domain state.

Speed dial actions only navigate. They do not calculate scroll offsets.

Services do not own scroll handoff state.
