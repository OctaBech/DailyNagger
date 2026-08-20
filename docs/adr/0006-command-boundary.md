# ADR 0006: Command Boundary

## Status

Accepted

## Context

DailyNagger screens can trigger many kinds of behavior: editing view state,
changing task data, queueing server updates, entering the editor, leaving the
editor, or later starting MCP work.

If screen components wire those behaviors directly, dependencies spread quickly.
A button press can start knowing about React hooks, memory, sending,
interaction stamps, tree operations, and server synchronization at the same
time. That makes actions harder to read and harder to reuse.

We want actions to read like small scripts. They should receive the context they
need and focus on the work, not on how a screen happened to wire that work.

## Decision

DailyNagger will keep a command boundary between screen commands and actions.

The command boundary owns:

- routing a command name to the matching action
- checking that the command came from an allowed source and scope
- choosing the right action context for that source
- keeping React hook wiring out of actions
- keeping screens from directly combining memory, sending, stamps, and tree
  operations
- providing a natural place for future command breadcrumbs

Screens may say what happened. Actions may perform the work. The command
boundary is the gate between those two worlds.

## Consequences

Feature code should not bypass the command boundary when it triggers shared app
behavior.

Actions can stay easier to read because they do not own `useCallback`,
`useMemo`, screen routing, or hook composition.

The boundary should stay thin. If it starts containing task-tree behavior, that
logic belongs in actions or lower-level tree operations.

Future observability can add command breadcrumbs here without spreading logging
calls through every button and modal.
