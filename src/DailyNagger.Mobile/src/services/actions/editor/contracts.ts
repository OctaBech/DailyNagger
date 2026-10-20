import type { TreeWithSelection } from "@/models";
import type { CultureSettings, Memory, UndoHistory } from "@/services/contracts";

export type EditorRuntimeDependencies = {
  readonly cultureSettings: CultureSettings;
  readonly memory: Memory;
  readonly undoHistory: UndoHistory<TreeWithSelection>;
};
