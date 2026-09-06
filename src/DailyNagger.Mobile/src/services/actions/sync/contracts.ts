import type { Memory } from "@/services/contracts";
import type { ActionSending } from "@/services/sending";

export type SyncActionScope = {
  readonly memory: Memory;
  readonly sending: ActionSending;
};
