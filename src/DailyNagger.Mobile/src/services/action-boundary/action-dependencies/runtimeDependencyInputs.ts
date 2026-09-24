import type { CultureSettings, InteractionStamp, Memory, Sending } from "@/services/contracts";

export type RuntimeDependencyInputs = {
  readonly cultureSettings: CultureSettings;
  readonly editorMemory: Memory;
  readonly planInteractionStamp: InteractionStamp;
  readonly planMemory: Memory;
  readonly sending: Sending;
};
