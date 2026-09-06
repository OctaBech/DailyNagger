# ADR 0016: Command Registration and Action Contracts

## Status

Accepted

## Context

DailyNagger uses a command boundary so screens can say what happened without
also knowing how memory, sending, interaction stamps, editor sessions, or tree
operations are wired.

That boundary is only useful if a reader can follow one command without getting
lost in repeated registrations. A command should have one clear registry entry,
one scope, one argument contract, and one action that performs the work.

The action packages are grouped by intent:

- `editor`
- `editor-session`
- `navigation`
- `sync`
- `task-input`
- `rollover`
- `loaded-plan-import`

The command argument contracts should follow the same grouping where commands
are routed through the command boundary.

## Decision

Commands are registered in `commandRegistry.ts`.

Each command registry entry must show the command name, the command scope, and
the command handler:

```ts
"task-item/set-focused": command("view", taskItemSetFocused)
```

The registry is the single place where a command becomes part of the command
boundary.

Command argument contracts live under `command-args/<scope-package>/` using the
same package names as the action groups. For example, navigation/view commands
use `command-args/navigation`, while plan input commands use
`command-args/task-input`.

Command handlers stay thin. They unpack the command arguments and delegate to
the matching action package:

```ts
export function taskItemSetFocused(args, context): void {
  navigationActions.taskItemSetFocused(context, args.taskItem);
}
```

Action packages own their runtime contracts. For example, `task-input` owns the
context it needs to record plan input and queue server work, while `editor` owns
the context it needs to mutate the editor draft.

The command boundary may choose the correct action context for a source and
scope, but it must not implement task-tree behavior itself.

## Registration Checklist

When adding a command:

1. Add or reuse an argument contract in `command-args/<scope-package>/`.
2. Add a thin handler in `commandHandlers.ts`.
3. Register the command once in `commandRegistry.ts` with the correct scope.
4. Put behavior in the matching `services/actions/<scope-package>/` action.

Do not create duplicate registries for the same command.

Do not put memory reads, tree mutations, selected-path refresh, sending queue
logic, or business rules inside the command handler.

## Consequences

A reader can follow the command path in one direction:

```text
commandRegistry -> command handler -> action package -> lower-level operation
```

Scopes remain meaningful because argument contracts and action contexts are
grouped by the same intent.

Adding a command requires a small amount of ceremony, but that ceremony protects
the boundary from becoming implicit React wiring or hidden domain logic.

Existing code may temporarily violate this decision. Refactors should move
toward this model without mixing unrelated behavior changes into the same
commit.
