import type { Memory } from "@/services/contracts";
import type { ActionSending } from "@/services/sending";

export type SyncRuntimeDependencies = {
  readonly memory: Memory;
  readonly sending: ActionSending;
};
