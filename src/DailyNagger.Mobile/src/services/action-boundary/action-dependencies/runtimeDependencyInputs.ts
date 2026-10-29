import type { TreeWithSelection } from "@/models";
import type {
  CultureSettings,
  Haptics,
  InteractionStamp,
  Memory,
  NodeClipboard,
  Sending,
  Startup,
  UndoHistory,
} from "@/services/contracts";

export type RuntimeDependencyInputs = {
  readonly cultureSettings: CultureSettings;
  readonly haptics: Haptics;
  readonly editorMemory: Memory;
  readonly nodeClipboard: NodeClipboard;
  readonly planInteractionStamp: InteractionStamp;
  readonly planMemory: Memory;
  readonly sending: Sending;
  readonly startup: Startup;
  readonly editorUndoHistory: UndoHistory<TreeWithSelection>;
};
