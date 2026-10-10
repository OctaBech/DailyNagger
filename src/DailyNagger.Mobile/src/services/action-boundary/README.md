# Action Boundary

Start in `useActionBoundary.ts`.

The action boundary turns registered service actions into stable proxy-action packages that frontstage can call.

Flow:

1. `useActionBoundary.ts` receives a named action registry, the shared action counter, and the current runtime inputs.
2. `useExecuteAction.ts` prepares the function that can execute one registered action.
3. `useBuildProxyActions.ts` turns the registry into proxy functions for frontstage.
4. Frontstage calls one of those functions with the action's argument object.
5. `useExecuteAction.ts` increments the shared action sequence, creates the causality key, passes the argument object unchanged, looks up the current service package, and runs the action.
6. `events/` describes the action lifecycle facts emitted for observability.

The services layer owns one `useRef` action-start counter shared by all screen and menu boundaries. It survives renders. Keys use `action:...|name:screen-or-menu/group/action|time:ISO-timestamp`. The counter describes start order, while the timestamp distinguishes app runs. This is a debugging identifier, not a guarantee of global uniqueness across devices.

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
