# ADR 0014: Service Built UI Contexts

## Status

Accepted

## Context And Decision

DailyNagger's mobile client uses a simple mental model:

```txt
services build the data
contexts carry the data
JSX renders the data
```

JSX should not assemble business rules, tree selection rules, or speed-dial
menus. It should read a context with the same name as the UI area it renders and
then render what it receives.

Examples:

- `PlanScreen` reads `PlanScreenData`.
- `EditorScreen` reads `EditorScreenData`.
- `AppShell` reads `AppShellState`.
- screen components call screen commands through command contexts.

This keeps JSX close to markup. Services can still use memory, selected paths,
commands, and business rules internally, but those details should be converted
into ready-to-use view models before they reach JSX.

Each UI area gets data through a context with the same name:

- `PlanScreenData` is for `PlanScreen`.
- `EditorScreenData` is for `EditorScreen`.
- `AppShellState` is for `AppShell`.

The same rule applies to commands: UI calls command contexts, not service
objects.

Speed-dial menus are built by services and delivered to `AppShell` as finished
`SpeedDialMenu` objects. `AppShell` should choose which menu to show, but it
should not know about `selectedPath`, `selectedNodes`, or tree rules.

## Consequences

This creates more explicit wiring in services, but keeps JSX simple and keeps
service internals out of layout components.

Existing code may temporarily violate this decision. Refactors should move
toward this model without mixing unrelated behavior changes into the same
commit.
