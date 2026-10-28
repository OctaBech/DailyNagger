import { isTaskItem, type TaskLog } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { EditorRuntimeDependencies } from "./contracts";

export function pasteNodeIntoTaskLog(
  { target }: { readonly target: TaskLog },
  { memory, undoHistory, nodeClipboard, haptics }: EditorRuntimeDependencies,
): void {
  const source = nodeClipboard.read();

  if (!isTaskItem(source)) {
    throw new Error("Cannot paste a TaskEntry into a TaskLog.");
  }

  const { tree, node, branch } = treeOperations;
  const { freshTree, freshTaskLog } = tree.readTaskLog(memory, target);
  const clone = node.cloneNodeStructure(source, freshTaskLog);

  undoHistory.record(memory.read.getTreeAndSelectedPath());

  const { newTree, newPath } = branch.addTaskItemToTaskLog(freshTree, freshTaskLog, clone);

  memory.write.setTreeAndFocusPath(newTree, newPath);
  haptics.play("selection");
}
