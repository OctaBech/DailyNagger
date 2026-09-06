import {
  normalizeTaskEntryValue,
  type TaskEntry,
  type TaskItem,
  type TaskLog,
  type TreeNode,
} from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { ActionSending, InteractionStamp, Memory } from "../contracts";

export type TaskInputActionScope = {
  readonly memory: Memory;
  readonly sending: ActionSending;
  readonly interactionStamp: InteractionStamp;
};

export function taskEntrySetValue(
  { memory, sending, interactionStamp }: TaskInputActionScope,
  taskEntry: TaskEntry,
  newValue: string | null,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshTaskEntry } = tree.readTaskEntry(memory, taskEntry);
  const normalizedValue = normalizeTaskEntryValue(freshTaskEntry.valueType, newValue);

  const taskEntryV1 = node.setTaskEntryValue(freshTaskEntry, normalizedValue);
  const stampedTaskEntry = interactionStamp.applyTo(taskEntryV1);

  const newTree = tree.replaceTaskEntry(freshTree, stampedTaskEntry);

  memory.write.setTree(newTree);

  sending.queue(stampedTaskEntry);
}

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

export function deleteOnceTaskItem(
  { memory, sending }: TaskInputActionScope,
  staleTaskItem: TaskItem,
): void {
  const { tree, branch } = treeOperations;

  const { freshTree, freshTaskItem } = tree.readTaskItem(memory, staleTaskItem);

  if (freshTaskItem.rolloverBehavior !== "RemoveWhenDone") {
    throw new Error(`TaskItem '${freshTaskItem.id}' is not a once TaskItem.`);
  }

  if (freshTaskItem.isDone) {
    throw new Error(`TaskItem '${freshTaskItem.id}' is already done and cannot be deleted.`);
  }

  const { newTree, newPath } = branch.deleteTaskItemSubtree(freshTree, freshTaskItem);

  memory.write.setTreeAndFocusPath(newTree, newPath);

  const updatedTaskLog = newPath.find(isTaskLog);

  if (updatedTaskLog === undefined) {
    throw new Error(`TaskLog for deleted TaskItem '${freshTaskItem.id}' was not found.`);
  }

  sending.queue(updatedTaskLog);
}

function isTaskLog(node: TreeNode): node is TaskLog {
  return node.nodeType === "TaskLog";
}
