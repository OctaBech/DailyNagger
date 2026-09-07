import type { ActionSending, InteractionStamp, Memory } from "../../contracts";

export type TaskInputRuntimeDependencies = {
  readonly memory: Memory;
  readonly sending: ActionSending;
  readonly interactionStamp: InteractionStamp;
};
