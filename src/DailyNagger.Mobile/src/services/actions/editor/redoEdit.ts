import type { EditorRuntimeDependencies } from "./contracts";

export function editorRedoEdit(
  _args: Record<string, never>,
  { memory, undoHistory }: EditorRuntimeDependencies,
): void {
  const { tree, selectedPath } = undoHistory.redo(memory.read.getTreeAndSelectedPath());
  memory.write.setTreeAndSelectedPath(tree, selectedPath);
}
