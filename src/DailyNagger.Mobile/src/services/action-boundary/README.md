# Action Boundary

Start in `useActionBoundary.ts`.

The action boundary turns registered service actions into stable action packs that JSX can call.

Flow:

1. `useActionBoundary.ts` receives an action registry and the current runtime inputs.
2. `useExecuteJsxAction.ts` prepares the function that can execute one JSX action.
3. `useBuildJsxActionPack.ts` turns the registry into functions for JSX.
4. JSX calls one of those functions with plain UI arguments.
5. `useExecuteJsxAction.ts` converts UI arguments, hydrates dependencies, and runs the action.
6. `events/` describes the action lifecycle facts emitted for observability.

Rules:

- JSX must not import service actions directly.
- Actions must not know about JSX.
- Register an action once in the relevant registry.
- The registry owns the action key, action scope, action function, and UI-to-action argument mapping.
- Observability may listen to events or wrap execution, but Sentry details stay outside normal action code.

