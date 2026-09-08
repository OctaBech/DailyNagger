import type { ActionSending, CultureSettings, InteractionStamp, Memory } from "@/services/contracts";
import type {
  ActionScope,
  RuntimeDependenciesForActionScope,
} from "./actionModel";
import type {
  editorActions,
  editorSessionActions,
  navigationActions,
  taskInputActions,
} from "../actions";

export type ActionRuntimeDependencyScreen = "plan" | "editor";

type ActionRuntimeDependencyInputs = {
  readonly cultureSettings: CultureSettings;
  readonly planMemory: Memory;
  readonly editorMemory: Memory;
  readonly planInteractionStamp: InteractionStamp;
  readonly sending?: ActionSending;
};

export function getActionRuntimeDependencies(
  screen: ActionRuntimeDependencyScreen,
  scope: ActionScope,
  inputs: ActionRuntimeDependencyInputs,
):
  | RuntimeDependenciesForActionScope<ActionScope> {
  switch (`${screen}:${scope}`) {
    case "plan:navigation":
      return { memory: inputs.planMemory } satisfies navigationActions.NavigationRuntimeDependencies;

    case "plan:task-input":
      if (inputs.sending === undefined) throw new Error("Task input actions require sending.");
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
      if (inputs.sending === undefined) throw new Error("Editor session actions require sending.");
      return {
        editorMemory: inputs.editorMemory,
        planMemory: inputs.planMemory,
        sending: inputs.sending,
      } satisfies editorSessionActions.EditorSessionRuntimeDependencies;

    default:
      throw new Error(`Screen '${screen}' cannot execute '${scope}' actions.`);
  }
}
