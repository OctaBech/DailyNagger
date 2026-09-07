import type { TaskItem, TaskLog } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { TaskInputRuntimeDependencies } from "./contracts";

export function taskLogAddTaskStep(
  args: {
    readonly taskLog: TaskLog;
    readonly name: string;
    readonly rolloverBehavior: TaskItem["rolloverBehavior"];
  },
  { memory, sending, interactionStamp }: TaskInputRuntimeDependencies,
): void {
  const { tree, branch, node } = treeOperations;
  const { freshTree, freshTaskLog } = tree.readTaskLog(memory, args.taskLog);

  const taskItemV1 = node.createTaskItem({
    taskLogId: freshTaskLog.id,
    parentTaskItemId: null,
  });
  const taskItemV2 = node.setTaskItemName(taskItemV1, args.name);
  const taskItemV3 = node.setTaskItemRolloverBehavior(taskItemV2, args.rolloverBehavior);
  const newTaskItem = interactionStamp.applyTo(taskItemV3);

  const { newTree, newPath } = branch.addTaskItemToTaskLog(freshTree, freshTaskLog, newTaskItem);

  memory.write.setTreeAndFocusPath(newTree, newPath);

  const { freshTaskLog: updatedTaskLog } = tree.readTaskLog(memory, newTaskItem);
  sending.queue(updatedTaskLog);
}
