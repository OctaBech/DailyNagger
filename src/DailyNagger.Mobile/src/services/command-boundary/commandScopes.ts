import type {
  editorActions,
  editorSessionActions,
  navigationActions,
  taskInputActions,
} from "../actions";

export type CommandViewActionContext = navigationActions.NavigationRuntimeDependencies;

export type CommandEditorActionContext = editorActions.EditorActionScope;

export type CommandInputActionContext = taskInputActions.TaskInputActionScope;

export type CommandEditorSessionActionContext = editorSessionActions.EditorSessionActionScope;

export type CommandActionContext =
  | CommandEditorActionContext
  | CommandEditorSessionActionContext
  | CommandInputActionContext
  | CommandViewActionContext;

export type CommandScope = "editor" | "editor-session" | "navigation" | "task-input";

export type SourceForScope<TScope extends CommandScope> = TScope extends "navigation"
  ? "editor-view" | "plan-view"
  : TScope extends "task-input"
    ? "plan-input"
  : TScope extends "editor"
        ? "editor-action"
        : TScope extends "editor-session"
          ? "editor-session"
          : never;

export type ContextForScope<TScope extends CommandScope> = TScope extends "navigation"
  ? CommandViewActionContext
  : TScope extends "task-input"
    ? CommandInputActionContext
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

