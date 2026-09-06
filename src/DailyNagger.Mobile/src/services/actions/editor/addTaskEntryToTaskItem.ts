import type { TaskItem } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { EditorActionScope } from "./contracts";

export function addTaskEntryToTaskItem(
  { memory }: EditorActionScope,
  staleTaskItem: TaskItem,
): void {
  const { tree, branch, node } = treeOperations;

  const { freshTree, freshTaskItem } = tree.readTaskItem(memory, staleTaskItem);

  const taskEntryV1 = node.createTaskEntry({
    taskLogId: freshTaskItem.taskLogId,
    parentTaskItemId: freshTaskItem.id,
  });

  const { newTree, newPath } = branch.addTaskEntryToTaskItem(freshTree, freshTaskItem, taskEntryV1);

  memory.write.setTreeAndFocusPath(newTree, newPath);
}
