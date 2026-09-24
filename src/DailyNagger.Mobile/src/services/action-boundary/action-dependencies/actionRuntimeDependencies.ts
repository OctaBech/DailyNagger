import type { RuntimeDependencyInputs } from "./runtimeDependencyInputs";
import type {
  editorActions,
  editorSessionActions,
  navigationActions,
  taskInputActions,
} from "@/services/actions";

type RuntimeDependenciesByScope = {
  readonly "plan/navigation": navigationActions.NavigationRuntimeDependencies;
  readonly "plan/task-input": taskInputActions.TaskInputRuntimeDependencies;
  readonly "editor/navigation": navigationActions.NavigationRuntimeDependencies;
  readonly "editor/action": editorActions.EditorRuntimeDependencies;
  readonly "editor/session": editorSessionActions.EditorSessionRuntimeDependencies;
};

export type ActionScope = keyof RuntimeDependenciesByScope;

export type RuntimeDependenciesForActionScope<TScope extends ActionScope> =
  RuntimeDependenciesByScope[TScope];

export function createActionRuntimeDependencies(
  inputs: RuntimeDependencyInputs,
): RuntimeDependenciesByScope {
  return {
    "plan/navigation": {
      memory: inputs.planMemory,
    },
    "plan/task-input": {
      memory: inputs.planMemory,
      sending: inputs.sending,
      interactionStamp: inputs.planInteractionStamp,
    },
    "editor/navigation": {
      memory: inputs.editorMemory,
    },
    "editor/action": {
      cultureSettings: inputs.cultureSettings,
      memory: inputs.editorMemory,
    },
    "editor/session": {
      editorMemory: inputs.editorMemory,
      planMemory: inputs.planMemory,
      sending: inputs.sending,
    },
  } satisfies RuntimeDependenciesByScope;
}
