import type { EditorRuntimeDependencies } from "./contracts";

export function editorUndoEdit(
  _args: Record<string, never>,
  { memory, undoHistory, haptics }: EditorRuntimeDependencies,
): void {
  const { tree, selectedPath } = undoHistory.undo(memory.read.getTreeAndSelectedPath());
  memory.write.setTreeAndSelectedPath(tree, selectedPath);
  haptics.play("selection");
}
