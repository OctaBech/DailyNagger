# ADR 0016: Command Registration and Action Contracts

## Status

Accepted

## Context

We want `@/services/actions` to contain one function per user action from JSX.

These action functions orchestrate the work needed for that user action:
reading fresh state, applying tree operations, updating memory, handling root
versioning, and queueing API sends.

Because each action can touch several parts of the app, the action function
must stay simple and readable from top to bottom, like a small script.

A button in JSX should not import those actions directly. If it does, the
component starts pulling in memory, sending, tree operations, interaction
stamps, editor state, and observability wiring.

That creates a dependency domino dilemma: either the user action becomes hard to
read because it is surrounded by hook wiring, dependency setup, and cross-screen
context, or JSX starts owning unstable dependencies that can turn ordinary
renders into rerender churn.

We need some form of command boundary between JSX and actions.

JSX should be able to render stable view models and call user actions without
importing the action functions directly. Actions should be able to read fresh
state, write memory, queue sends, and use observability without forcing JSX to
own those dependencies or rerender because action dependencies changed.

Registering an action in the command boundary should not create a large amount
of overhead. A reader should be able to find the command registration in one
place and follow it to the action.

## Decision

Services build screen and menu view models that contain command names as
strings. JSX renders those commands without knowing the action function behind
them.

When the user presses a button, JSX sends the command name and command arguments
back to the command boundary. The boundary maps the command to the real action
function and gives that action the correct runtime dependencies.

Action functions use two argument groups:

1. command arguments from JSX
2. runtime dependencies hydrated by the command dispatcher from source and scope

The terms mean:

- command args come from JSX
- scope decides which action package may be called
- source identifies where the command came from
- runtime dependencies are memory, sending, stamps, culture settings, and other
  dependencies hydrated by the dispatcher

The action signature owns the command argument type. We do not define command
arguments a second time in the command boundary. Duplicating those types makes
it possible to change an action parameter without noticing that JSX still sends
an outdated command argument package.

The command boundary should derive command argument types from the registered
action function so TypeScript can carry the contract from the action all the way
out to JSX.

```ts
export function taskEntrySetValue(
  args: {
    readonly taskEntry: TaskEntry;
    readonly newValue: string | null;
  },
  context: TaskInputActionScope,
): void {
  // read fresh state, mutate tree, write memory, queue send
}
```

The command boundary has a `commandRegistry`, where user actions are given text
command names:

```ts
export const commandActions = {
  "task-item/set-focused": command("navigation", taskItemSetFocused),
  "task-entry/set-value": command("task-input", taskEntrySetValue),
} as const;
```

Each entry connects three things:

- the command name JSX can dispatch
- the scope the command is allowed to run in
- the action function that owns the command argument type

The registry is the single place where a command becomes part of the command
boundary.

Command scopes use the same names as the action packages they are allowed to
call.

Action packages and command scopes are grouped by intent:

- `editor`
- `editor-session`
- `navigation`
- `task-input`
- `rollover`
- `loaded-plan-import`

The command source identifies where the command came from, for example
`plan-input`, `editor-action`, or `editor-session`.

The scope decides which runtime dependencies the command may receive. Those
dependencies are based on the source and contain only what that action category
is allowed to use.

Command registries live under `command-registry/<scope-package>.ts`. Command
argument contracts are derived from the registered action functions. Runtime
dependency contracts live under
`services/actions/<scope-package>/contracts.ts`.

For a scope named `task-input`:

- command registry entries live in `command-registry/task-input.ts`
- action functions live in `services/actions/task-input`
- runtime dependency contracts live in
  `services/actions/task-input/contracts.ts`

Action packages own their runtime dependency contracts. For example,
`task-input` owns the dependencies it needs to record plan input and queue
server work, while `editor` owns the dependencies it needs to mutate the editor
draft.

The command boundary may choose the correct action context for a source and
scope, but it must not implement task-tree behavior itself.

## Registration Checklist

When adding a command:

1. Put behavior in the matching `services/actions/<scope-package>/` action.
2. Let the action function signature own the command argument type.
3. Register the command once in `command-registry/<scope-package>.ts`.
4. Use the matching scope name so the dispatcher can hydrate the runtime
   context.

Do not create duplicate registries for the same command.

Do not create a second command argument type in the command boundary when the
action signature already owns it.

## Consequences

A reader can follow the command path in one direction:

```text
commandRegistry -> action package -> lower-level operation
```

Scopes remain meaningful because argument contracts and action contexts are
grouped by the same intent and use the same package names.

Adding a command requires a small amount of ceremony, but that ceremony protects
the boundary from becoming implicit React wiring, hidden domain logic, or a
second source of truth for command arguments.

Existing code may temporarily violate this decision. Refactors should move
toward this model without mixing unrelated behavior changes into the same
commit.
