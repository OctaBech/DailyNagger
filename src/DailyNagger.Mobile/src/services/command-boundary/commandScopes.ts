import type {
  editorActions,
  editorSessionActions,
  navigationActions,
  syncActions,
  taskInputActions,
} from "../actions";

export type CommandViewActionContext = navigationActions.NavigationActionScope;

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

export type CommandScope = "editor-action" | "editor-session" | "input" | "sync" | "view";

export type SourceForScope<TScope extends CommandScope> = TScope extends "view"
  ? "editor-view" | "plan-view"
  : TScope extends "input"
    ? "plan-input"
    : TScope extends "sync"
      ? "editor-sync" | "plan-sync"
      : TScope extends "editor-action"
        ? "editor-action"
        : TScope extends "editor-session"
          ? "editor-session"
          : never;

export type ContextForScope<TScope extends CommandScope> = TScope extends "view"
  ? CommandViewActionContext
  : TScope extends "input"
    ? CommandInputActionContext
    : TScope extends "sync"
      ? CommandSyncActionContext
      : TScope extends "editor-action"
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
