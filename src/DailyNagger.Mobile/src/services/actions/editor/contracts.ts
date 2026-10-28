import type { TreeWithSelection } from "@/models";
import type {
  CultureSettings,
  Haptics,
  Memory,
  NodeClipboard,
  UndoHistory,
} from "@/services/contracts";

export type EditorRuntimeDependencies = {
  readonly cultureSettings: CultureSettings;
  readonly haptics: Haptics;
  readonly memory: Memory;
  readonly nodeClipboard: NodeClipboard;
  readonly undoHistory: UndoHistory<TreeWithSelection>;
};
