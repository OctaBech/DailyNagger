import type { ActionSending, InteractionStamp, Memory } from "../../contracts";

export type TaskInputActionScope = {
  readonly memory: Memory;
  readonly sending: ActionSending;
  readonly interactionStamp: InteractionStamp;
};
