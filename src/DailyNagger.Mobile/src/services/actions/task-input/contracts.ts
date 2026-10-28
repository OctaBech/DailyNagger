import type { Haptics, InteractionStamp, Memory, Sending } from "../../contracts";

export type TaskInputRuntimeDependencies = {
  readonly haptics: Haptics;
  readonly memory: Memory;
  readonly sending: Sending;
  readonly interactionStamp: InteractionStamp;
};
