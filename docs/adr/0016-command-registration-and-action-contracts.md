# ADR 0016: Command Registration and Action Contracts

## Status

Accepted

## Context

DailyNagger wants actions to live in services and read like small behavior
scripts.

A button in JSX should not import those actions directly. If it does, the
component starts pulling in memory, sending, tree operations, interaction
stamps, editor state, and observability wiring.

That creates dependency domino.

Instead, services can build screen and menu view models that contain command
names as strings. JSX can render those commands without knowing the action
function behind them.

When the user presses a button, JSX sends the command name and command arguments
back to the command boundary. The boundary maps the command to the real action
function and gives that action the correct runtime context.

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

The command boundary maps command names to real action functions.

Commands are registered in `commandRegistry.ts`.

Each command registry entry must show the command name, the command scope, and
the command handler:

```ts
"task-item/set-focused": command("view", taskItemSetFocused)
```

The registry is the single place where a command becomes part of the command
boundary.

The command source identifies where the command came from, for example
`plan-input`, `editor-action`, or `editor-session`.

The scope decides which runtime context the command may receive. That context is
based on the source and contains only the dependencies that action category is
allowed to use.

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
