import { isTaskItem, type TaskEntry, type TaskItem } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { EditorRuntimeDependencies } from "./contracts";

export function pasteNodeIntoTaskItem(
  { target }: { readonly target: TaskItem | TaskEntry },
  { memory, undoHistory, nodeClipboard, haptics }: EditorRuntimeDependencies,
): void {
  const source = nodeClipboard.read();
  const { tree, node, branch } = treeOperations;
  const { freshTree, freshTaskItem } = tree.readTaskItem(memory, target);
  const clone = node.cloneNodeStructure(source, freshTaskItem);

  undoHistory.record(memory.read.getTreeAndSelectedPath());

  const { newTree, newPath } = isTaskItem(clone)
    ? branch.addTaskItemToTaskItem(freshTree, freshTaskItem, clone)
    : branch.addTaskEntryToTaskItem(freshTree, freshTaskItem, clone);

  memory.write.setTreeAndFocusPath(newTree, newPath);
  haptics.play("selection");
}
