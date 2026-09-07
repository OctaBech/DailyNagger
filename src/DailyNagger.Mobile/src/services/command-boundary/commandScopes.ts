import type {
  editorActions,
  editorSessionActions,
  navigationActions,
  syncActions,
  taskInputActions,
} from "../actions";

export type CommandViewActionContext = navigationActions.NavigationRuntimeDependencies;

export type CommandSyncActionContext = syncActions.SyncActionScope;

export type CommandEditorActionContext = editorActions.EditorActionScope;

export type CommandInputActionContext = taskInputActions.TaskInputActionScope;

export type CommandEditorSessionActionContext = editorSessionActions.EditorSessionActionScope;

export type CommandActionContext =
  | CommandEditorActionContext
  | CommandEditorSessionActionContext
  | CommandInputActionContext
  | CommandSyncActionContext
  | CommandViewActionContext;

export type CommandScope = "editor" | "editor-session" | "navigation" | "sync" | "task-input";

export type SourceForScope<TScope extends CommandScope> = TScope extends "navigation"
  ? "editor-view" | "plan-view"
  : TScope extends "task-input"
    ? "plan-input"
  : TScope extends "sync"
    ? "editor-sync" | "plan-sync"
    : TScope extends "editor"
        ? "editor-action"
        : TScope extends "editor-session"
          ? "editor-session"
          : never;

export type ContextForScope<TScope extends CommandScope> = TScope extends "navigation"
  ? CommandViewActionContext
  : TScope extends "task-input"
    ? CommandInputActionContext
  : TScope extends "sync"
    ? CommandSyncActionContext
    : TScope extends "editor"
        ? CommandEditorActionContext
        : TScope extends "editor-session"
          ? CommandEditorSessionActionContext
          : never;

export type CommandDefinition<TScope extends CommandScope, TArgs> = {
  readonly scope: TScope;
  readonly run: (args: TArgs, context: ContextForScope<TScope>) => void;
};

export function command<TScope extends CommandScope, TArgs>(
  scope: TScope,
  run: (args: TArgs, context: ContextForScope<TScope>) => void,
): CommandDefinition<TScope, TArgs> {
  return { scope, run };
}

