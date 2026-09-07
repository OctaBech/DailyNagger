import type { Memory } from "@/services/memory";
import type { ActionSending } from "@/services/sending";

export type EditorSessionRuntimeDependencies = {
  readonly editorMemory: Memory;
  readonly planMemory: Memory;
  readonly sending: ActionSending;
};
