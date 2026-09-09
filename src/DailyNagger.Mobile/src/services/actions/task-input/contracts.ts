import type { InteractionStamp, Memory, Sending } from "../../contracts";

export type TaskInputRuntimeDependencies = {
  readonly memory: Memory;
  readonly sending: Sending;
  readonly interactionStamp: InteractionStamp;
};

