# Action Boundary

Start in `useActionBoundary.ts`.

The action boundary turns registered service actions into stable proxy-action packages that frontstage can call.

Flow:

1. `useActionBoundary.ts` receives an action registry and the current runtime inputs.
2. `useExecuteAction.ts` prepares the function that can execute one registered action.
3. `useBuildProxyActions.ts` turns the registry into proxy functions for frontstage.
4. Frontstage calls one of those functions with the action's argument object.
5. `useExecuteAction.ts` passes that object unchanged, looks up the current service package, and runs the action.
6. `events/` describes the action lifecycle facts emitted for observability.

Rules:

- JSX must not import service actions directly.
- Actions must not know about JSX.
- Register an action once in the relevant registry.
- The registry owns the action key, service-package name, and action function. No argument mapper is needed.
- Proxy argument types are inferred directly from the registered action function.
- Observability may listen to events or wrap execution, but Sentry details stay outside normal action code.

Example:

```ts
setValue: registerAction(taskInputActions.taskEntrySetValue, "plan/task-input");
```

```ts
proxyActions.taskEntry.setValue({ taskEntry, newValue });
```
