# Services

Services connect screens, memory, sending, and app behavior.

This folder is the wiring layer. It should make it easy to see which part of the
app owns a job.

## Main Pieces

- `screen-commands` gives components simple functions to call.
- `command-boundary` stops component dependencies from spreading into action
  code.
- `actions` contains the actual behavior scripts.
- `tree-operations` reads and changes the task tree.
- `memory`, `sending`, startup, loading, mood, and related folders own their own
  runtime state.

## Screen Commands

Screen commands are small adapters for components.

They let component code call names such as `taskEntry.setValue(...)` without
knowing command strings, scopes, or dispatcher details.

They should stay thin:

- accept component-friendly arguments
- dispatch one command
- avoid reading or mutating memory directly

## Where Rules Live

- Use `@/services/actions/README.md` for action script style.
- Use `@/services/command-boundary/README.md` for command boundary rules.
- Use `@/services/tree-operations/README.md` for task tree mutation rules.
- Use local READMEs when a folder needs rules that should not leak into the
  whole service layer.
