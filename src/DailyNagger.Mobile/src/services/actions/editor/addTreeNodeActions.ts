import type { TaskItem, TaskLog } from "@/models";
import type { Memory } from "@/services/contracts";
import { treeOperations } from "@/services/tree-operations";

type AddTreeNodeActionScope = {
  readonly memory: Memory;
};

export function addTaskEntryToTaskItem(
  { memory }: AddTreeNodeActionScope,
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

export function addTaskItemToTaskLog(
  { memory }: AddTreeNodeActionScope,
  staleTaskLog: TaskLog,
): void {
  const { tree, branch, node } = treeOperations;

  const { freshTree, freshTaskLog } = tree.readTaskLog(memory, staleTaskLog);

  const taskItemV1 = node.createTaskItem({
    taskLogId: freshTaskLog.id,
    parentTaskItemId: null,
  });

  const { newTree, newPath } = branch.addTaskItemToTaskLog(freshTree, freshTaskLog, taskItemV1);

  memory.write.setTreeAndFocusPath(newTree, newPath);
}

export function addTaskItemToTaskItem(
  { memory }: AddTreeNodeActionScope,
  staleTaskItem: TaskItem,
): void {
  const { tree, branch, node } = treeOperations;

  const { freshTree, freshTaskItem } = tree.readTaskItem(memory, staleTaskItem);

  const taskItemV1 = node.createTaskItem({
    taskLogId: freshTaskItem.taskLogId,
    parentTaskItemId: freshTaskItem.id,
  });

  const { newTree, newPath } = branch.addTaskItemToTaskItem(freshTree, freshTaskItem, taskItemV1);

  memory.write.setTreeAndFocusPath(newTree, newPath);
}
