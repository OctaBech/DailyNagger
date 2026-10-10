import type { RuntimeDependencyInputs } from "./runtimeDependencyInputs";
import type {
  editorActions,
  editorSessionActions,
  navigationActions,
  taskInputActions,
} from "@/services/actions";

type RuntimeDependenciesByScope = ReturnType<typeof createActionRuntimeDependencies>;

export type ActionScope = keyof RuntimeDependenciesByScope;

export type RuntimeDependenciesForActionScope<TScope extends ActionScope> =
  RuntimeDependenciesByScope[TScope];

export function createActionRuntimeDependencies(inputs: RuntimeDependencyInputs) {
  return {
    "plan/navigation": {
      memory: inputs.planMemory,
    } satisfies navigationActions.NavigationRuntimeDependencies,
    "plan/task-input": {
      memory: inputs.planMemory,
      sending: inputs.sending,
      interactionStamp: inputs.planInteractionStamp,
    } satisfies taskInputActions.TaskInputRuntimeDependencies,
    "editor/navigation": {
      memory: inputs.editorMemory,
    } satisfies navigationActions.NavigationRuntimeDependencies,
    "editor/action": {
      cultureSettings: inputs.cultureSettings,
      memory: inputs.editorMemory,
    } satisfies editorActions.EditorRuntimeDependencies,
    "editor/session": {
      editorMemory: inputs.editorMemory,
      planMemory: inputs.planMemory,
      sending: inputs.sending,
    } satisfies editorSessionActions.EditorSessionRuntimeDependencies,
  };
}
