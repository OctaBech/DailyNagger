import type { TaskItem } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { TaskInputActionScope } from "./contracts";

export function taskItemSetDoneAndSetFocus(
  { memory, sending, interactionStamp }: TaskInputActionScope,
  taskItem: TaskItem,
  isDone: boolean,
): void {
  const { tree, branch, node } = treeOperations;
  const { freshTree, freshTaskItem } = tree.readTaskItem(memory, taskItem);

  if (freshTaskItem.isDone === isDone) return;

  const taskItemV1 = node.setTaskItemDone(freshTaskItem, isDone);
  const updatedTaskItem = interactionStamp.applyTo(taskItemV1);

  const { newTree, newPath } = branch.replaceTaskItemAndUpdateDoneCounts(
    freshTree,
    updatedTaskItem,
  );

  memory.write.setTreeAndFocusPath(newTree, newPath);

  const { freshTaskLog } = tree.readTaskLog(memory, taskItem);
  sending.queue(freshTaskLog);
}
