# Services

Services connect screens, memory, sending, and app behavior.

This folder is the wiring layer. It should make it easy to see which part of the
app owns a job.

## Main Pieces

- `screen-commands` exposes screen JSX action contexts to components.
- `action-boundary` turns registered service actions into stable JSX-callable
  functions without leaking runtime dependencies into components.
- `screen-dial-menus` builds speed-dial view models from selected state and dial
  JSX actions.
- `actions` contains the actual behavior scripts.
- `tree-operations` reads and changes the task tree.
- `memory`, `sending`, startup, loading, mood, and related folders own their own
  runtime state.

## Screen Commands

Screen commands own the React context hooks for screen JSX actions.

They should stay thin:

- expose a typed context for screen components
- receive already-created JSX action functions
- avoid command strings, dispatchers, memory reads, or mutations

## Where Rules Live

- Use `@/services/actions/README.md` for action script style.
- Use `@/services/action-boundary` for action registration and runtime mapping.
- Use `@/services/tree-operations/README.md` for task tree mutation rules.
- Use local READMEs when a folder needs rules that should not leak into the
  whole service layer.
