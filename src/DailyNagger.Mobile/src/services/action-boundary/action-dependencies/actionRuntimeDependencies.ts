import type { RuntimeDependencyInputs } from "./runtimeDependencyInputs";
import type { DemoRuntimeDependencies } from "@/services/actions/demoData";
import type {
  editorActions,
  editorSessionActions,
  navigationActions,
  taskInputActions,
} from "@/services/actions";

export type ServicePackages = ReturnType<typeof createActionRuntimeDependencies>;

export type ServicePackageName = keyof ServicePackages;

export type ServicePackage<TServicePackageName extends ServicePackageName> =
  ServicePackages[TServicePackageName];

export function createActionRuntimeDependencies(inputs: RuntimeDependencyInputs) {
  return {
    "plan/demo": {
      memory: inputs.planMemory,
      sending: inputs.sending,
      startup: inputs.startup,
    } satisfies DemoRuntimeDependencies,
    "plan/navigation": {
      memory: inputs.planMemory,
    } satisfies navigationActions.NavigationRuntimeDependencies,
    "plan/task-input": {
      haptics: inputs.haptics,
      memory: inputs.planMemory,
      sending: inputs.sending,
      interactionStamp: inputs.planInteractionStamp,
    } satisfies taskInputActions.TaskInputRuntimeDependencies,
    "editor/navigation": {
      memory: inputs.editorMemory,
    } satisfies navigationActions.NavigationRuntimeDependencies,
    "editor/action": {
      cultureSettings: inputs.cultureSettings,
      haptics: inputs.haptics,
      memory: inputs.editorMemory,
      nodeClipboard: inputs.nodeClipboard,
      undoHistory: inputs.editorUndoHistory,
    } satisfies editorActions.EditorRuntimeDependencies,
    "editor/session": {
      haptics: inputs.haptics,
      editorMemory: inputs.editorMemory,
      planMemory: inputs.planMemory,
      sending: inputs.sending,
      undoHistory: inputs.editorUndoHistory,
    } satisfies editorSessionActions.EditorSessionRuntimeDependencies,
  };
}
