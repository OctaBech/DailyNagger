import type { RuntimeDependencyInputs } from "./runtimeDependencyInputs";
import type {
  editorActions,
  editorSessionActions,
  navigationActions,
  taskInputActions,
} from "@/services/actions";

export type ActionScope = "navigation" | "task-input" | "editor" | "editor-session";
export type ActionRuntimeDependencyScreen = "plan" | "editor";

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

export function getActionRuntimeDependencies(
  screen: ActionRuntimeDependencyScreen,
  scope: ActionScope,
  inputs: RuntimeDependencyInputs,
): RuntimeDependenciesForActionScope<ActionScope> {
  switch (`${screen}:${scope}`) {
    case "plan:navigation":
      return { memory: inputs.planMemory } satisfies navigationActions.NavigationRuntimeDependencies;

    case "plan:task-input":
      return {
        memory: inputs.planMemory,
        sending: inputs.sending,
        interactionStamp: inputs.planInteractionStamp,
      } satisfies taskInputActions.TaskInputRuntimeDependencies;

    case "editor:editor":
      return {
        cultureSettings: inputs.cultureSettings,
        memory: inputs.editorMemory,
      } satisfies editorActions.EditorRuntimeDependencies;

    case "editor:navigation":
      return { memory: inputs.editorMemory } satisfies navigationActions.NavigationRuntimeDependencies;

    case "editor:editor-session":
      return {
        editorMemory: inputs.editorMemory,
        planMemory: inputs.planMemory,
        sending: inputs.sending,
      } satisfies editorSessionActions.EditorSessionRuntimeDependencies;

    default:
      throw new Error(`Screen '${screen}' cannot execute '${scope}' actions.`);
  }
}



