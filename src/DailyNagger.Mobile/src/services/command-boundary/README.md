# Command Boundary

The command boundary exists to stop dependency domino.

Without this folder, a simple button press can quickly pull half the app into
the same file: component props, screen hooks, memory, sending, interaction
stamps, and the action that changes the tree. Once that happens, a small fix in
one place starts forcing changes in several unrelated places.

This folder is the gate between "the screen says something happened" and "the
app performs the right behavior with the right runtime context".

## Job

- receive a command name and its arguments
- choose the right action context for the command source
- reject commands from the wrong source/scope
- run the matching action
- keep action code free from `useCallback`, `useMemo`, and other React hook wiring

## Flow

Components call screen commands.

Screen commands dispatch a command name and arguments.

The command boundary looks up the command, builds the action context for the
source, checks that the source is allowed to run that command scope, and then
runs the action.

Actions should only receive the context and data they need to do the work.

## Observability

This folder is a natural place for command breadcrumbs.

A breadcrumb here can say: "the user asked the app to run this command from this
screen scope." That is useful later when an error happens deeper in memory,
sending, tree operations, or MCP work.

Keep those breadcrumbs small and structural:

- command name
- command source
- command scope
- ids that are already part of the command contract

Do not dump full task trees, notes, values, or modal text into breadcrumbs. The
command boundary should explain the path of an action, not leak user content.

## Scopes

Scopes are the guard rails. They describe what kind of runtime context an action
is allowed to receive.

- `view` commands can update local view state only.
- `input` commands can change data and queue server work.
- `sync` commands can perform server-facing synchronization work.
- `editor-action` commands can mutate the editor tree while staying inside the
  editor session.
- `editor-session` commands can coordinate plan memory, editor memory, and
  sending when entering or leaving the editor.

If a screen command sends the wrong source for a command, this folder throws
instead of letting the bug spread deeper into the app.

## Working Here

Add a command here when a screen needs to trigger behavior through the shared
command path.

Keep the boundary thin. It may translate command arguments into an action call,
but it should not become the place where task-tree behavior is implemented.

If the code starts reading like business logic, move that logic into an action
or a lower-level operation and let this folder keep doing the routing.
