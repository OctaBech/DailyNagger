import type { TreeWithSelection } from "@/models";
import type { Memory, UndoHistory, Sending } from "@/services/contracts";

export type EditorSessionRuntimeDependencies = {
  readonly editorMemory: Memory;
  readonly planMemory: Memory;
  readonly sending: Sending;
  readonly undoHistory: UndoHistory<TreeWithSelection>;
};
