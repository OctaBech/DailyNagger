import type { TreeWithSelection } from "@/models";
import type {
  CultureSettings,
  InteractionStamp,
  Memory,
  Sending,
  UndoHistory,
} from "@/services/contracts";

export type RuntimeDependencyInputs = {
  readonly cultureSettings: CultureSettings;
  readonly editorMemory: Memory;
  readonly planInteractionStamp: InteractionStamp;
  readonly planMemory: Memory;
  readonly sending: Sending;
  readonly editorUndoHistory: UndoHistory<TreeWithSelection>;
};
