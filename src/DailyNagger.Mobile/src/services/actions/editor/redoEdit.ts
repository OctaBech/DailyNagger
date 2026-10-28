import type { EditorRuntimeDependencies } from "./contracts";

export function editorRedoEdit(
  _args: Record<string, never>,
  { memory, undoHistory, haptics }: EditorRuntimeDependencies,
): void {
  const { tree, selectedPath } = undoHistory.redo(memory.read.getTreeAndSelectedPath());
  memory.write.setTreeAndSelectedPath(tree, selectedPath);
  haptics.play("selection");
}
