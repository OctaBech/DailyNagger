import type {
  editorActions,
  editorSessionActions,
  navigationActions,
  taskInputActions,
} from "../actions";

export type ActionScope = "navigation" | "task-input" | "editor" | "editor-session";

export type RuntimeDependenciesForActionScope<TScope extends ActionScope> =
  TScope extends "navigation"
    ? navigationActions.NavigationRuntimeDependencies
    : TScope extends "task-input"
      ? taskInputActions.TaskInputRuntimeDependencies
      : TScope extends "editor"
        ? editorActions.EditorRuntimeDependencies
        : TScope extends "editor-session"
          ? editorSessionActions.EditorSessionRuntimeDependencies
          : never;

export type RegisteredAction<TScope extends ActionScope, TActionArgs, TPublicArgs extends unknown[]> = {
  readonly scope: TScope;
  readonly toActionArgs: (...publicArgs: TPublicArgs) => TActionArgs;
  readonly run: (
    args: TActionArgs,
    runtimeDependencies: RuntimeDependenciesForActionScope<TScope>,
  ) => void;
};

export function registeredAction<TScope extends ActionScope, TActionArgs, TPublicArgs extends unknown[]>(
  scope: TScope,
  run: (args: TActionArgs, runtimeDependencies: RuntimeDependenciesForActionScope<TScope>) => void,
  toActionArgs: (...publicArgs: TPublicArgs) => TActionArgs,
): RegisteredAction<TScope, TActionArgs, TPublicArgs> {
  return { scope, run, toActionArgs };
}
