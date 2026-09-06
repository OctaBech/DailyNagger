import type { TaskItem, TaskLog } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { TaskInputActionScope } from "./contracts";

export function taskLogAddTaskStep(
  { memory, sending, interactionStamp }: TaskInputActionScope,
  taskLog: TaskLog,
  name: string,
  rolloverBehavior: TaskItem["rolloverBehavior"],
): void {
  const { tree, branch, node } = treeOperations;
  const { freshTree, freshTaskLog } = tree.readTaskLog(memory, taskLog);

  const taskItemV1 = node.createTaskItem({
    taskLogId: freshTaskLog.id,
    parentTaskItemId: null,
  });
  const taskItemV2 = node.setTaskItemName(taskItemV1, name);
  const taskItemV3 = node.setTaskItemRolloverBehavior(taskItemV2, rolloverBehavior);
  const newTaskItem = interactionStamp.applyTo(taskItemV3);

  const { newTree, newPath } = branch.addTaskItemToTaskLog(freshTree, freshTaskLog, newTaskItem);

  memory.write.setTreeAndFocusPath(newTree, newPath);

  const { freshTaskLog: updatedTaskLog } = tree.readTaskLog(memory, newTaskItem);
  sending.queue(updatedTaskLog);
}
