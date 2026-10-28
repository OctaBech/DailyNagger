import type { TreeWithSelection } from "@/models";
import type { Haptics, Memory, UndoHistory, Sending } from "@/services/contracts";

export type EditorSessionRuntimeDependencies = {
  readonly haptics: Haptics;
  readonly editorMemory: Memory;
  readonly planMemory: Memory;
  readonly sending: Sending;
  readonly undoHistory: UndoHistory<TreeWithSelection>;
};
