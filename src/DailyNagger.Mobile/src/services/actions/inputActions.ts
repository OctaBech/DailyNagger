import type { TaskEntryValueType } from "@/api";
import {
  normalizeTaskEntryValue,
  type Nagger,
  type ScheduleRule,
  type TaskEntry,
  type TaskItem,
  type TaskLog,
} from "@/models";
import { scheduleCalculator } from "@/services/schedule-calculator";
import { treeOperations } from "@/services/tree-operations";
import type { ActionSending, CultureSettings, InteractionStamp, Memory } from "../contracts";

export type InputActionScope = {
  readonly cultureSettings: CultureSettings;
  readonly memory: Memory;
  readonly sending: ActionSending;
  readonly interactionStamp: InteractionStamp | null;
};

export function taskEntrySetValue(
  { memory, sending, interactionStamp }: InputActionScope,
  taskEntry: TaskEntry,
  newValue: string | null,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshTaskEntry } = tree.readTaskEntry(memory, taskEntry);
  const normalizedValue = normalizeTaskEntryValue(freshTaskEntry.valueType, newValue);

  const taskEntryV1 = node.setTaskEntryValue(freshTaskEntry, normalizedValue);
  const stampedTaskEntry =
    interactionStamp === null ? taskEntryV1 : interactionStamp.applyTo(taskEntryV1);

  const newTree = tree.replaceTaskEntry(freshTree, stampedTaskEntry);

  memory.write.setTree(newTree);

  sending.queue(stampedTaskEntry);
}

export function taskItemSetDoneAndSetFocus(
  { memory, sending, interactionStamp }: InputActionScope,
  taskItem: TaskItem,
  isDone: boolean,
): void {
  const { tree, branch, node } = treeOperations;
  const { freshTree, freshTaskItem } = tree.readTaskItem(memory, taskItem);

  if (freshTaskItem.isDone === isDone) return;

  const taskItemV1 = node.setTaskItemDone(freshTaskItem, isDone);
  const updatedTaskItem =
    interactionStamp === null ? taskItemV1 : interactionStamp.applyTo(taskItemV1);

  const { newTree, newPath } = branch.replaceTaskItemAndUpdateDoneCounts(
    freshTree,
    updatedTaskItem,
  );

  memory.write.setTreeAndFocusPath(newTree, newPath);

  const { freshTaskLog } = tree.readTaskLog(memory, taskItem);
  sending.queue(freshTaskLog);
}

export function taskLogAddTaskStep(
  { memory, sending, interactionStamp }: InputActionScope,
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
  const newTaskItem = interactionStamp === null ? taskItemV3 : interactionStamp.applyTo(taskItemV3);

  const { newTree, newPath } = branch.addTaskItemToTaskLog(freshTree, freshTaskLog, newTaskItem);

  memory.write.setTreeAndFocusPath(newTree, newPath);

  const { freshTaskLog: updatedTaskLog } = tree.readTaskLog(memory, newTaskItem);
  sending.queue(updatedTaskLog);
}

export function taskItemSetName(
  { memory }: InputActionScope,
  taskItem: TaskItem,
  name: string,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshTaskItem } = tree.readTaskItem(memory, taskItem);
  const taskItemV1 = node.setTaskItemName(freshTaskItem, name);
  const result = tree.replaceNode(freshTree, taskItemV1);

  memory.write.setTree(result.newTree);
}

export function taskLogSetTag(
  { memory }: InputActionScope,
  taskLog: TaskLog,
  tag: string | null,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshTaskLog } = tree.readTaskLog(memory, taskLog);
  const taskLogV1 = node.setTaskLogTag(freshTaskLog, tag);
  const result = tree.replaceNode(freshTree, taskLogV1);

  memory.write.setTreeAndSelectedPath(result.newTree, result.newPath);
}

export function taskItemSetTag(
  { memory }: InputActionScope,
  taskItem: TaskItem,
  tag: string | null,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshTaskItem } = tree.readTaskItem(memory, taskItem);
  const taskItemV1 = node.setTaskItemTag(freshTaskItem, tag);
  const result = tree.replaceNode(freshTree, taskItemV1);

  memory.write.setTreeAndSelectedPath(result.newTree, result.newPath);
}

export function naggerSetTitle({ memory }: InputActionScope, nagger: Nagger, title: string): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshNagger } = tree.readNagger(memory, nagger);
  const naggerV1 = node.setNaggerTitle(freshNagger, title);
  const result = tree.replaceNode(freshTree, naggerV1);

  memory.write.setTree(result.newTree);
}

export function naggerSetScheduleRules(
  { cultureSettings, memory }: InputActionScope,
  nagger: Nagger,
  scheduleRules: readonly ScheduleRule[],
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshNagger } = tree.readNagger(memory, nagger);
  const activeLogDueOn = scheduleCalculator.getNextDueOn(
    { ...freshNagger, scheduleRules },
    cultureSettings,
  );
  const naggerV1 = node.setNaggerScheduleRules(freshNagger, scheduleRules, activeLogDueOn);
  const result = tree.replaceNode(freshTree, naggerV1);

  memory.write.setTreeAndSelectedPath(result.newTree, result.newPath);
}

export function naggerSetTargetTime(
  { memory }: InputActionScope,
  nagger: Nagger,
  targetTime: string | null,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshNagger } = tree.readNagger(memory, nagger);
  const naggerV1 = node.setNaggerTargetTime(freshNagger, targetTime);
  const result = tree.replaceNode(freshTree, naggerV1);

  memory.write.setTreeAndSelectedPath(result.newTree, result.newPath);
}

export function taskEntrySetLabel(
  { memory }: InputActionScope,
  taskEntry: TaskEntry,
  label: string,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshTaskEntry } = tree.readTaskEntry(memory, taskEntry);
  const taskEntryV1 = node.setTaskEntryLabel(freshTaskEntry, label);
  const result = tree.replaceNode(freshTree, taskEntryV1);

  memory.write.setTree(result.newTree);
}

export function taskEntrySetTag(
  { memory }: InputActionScope,
  taskEntry: TaskEntry,
  tag: string | null,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshTaskEntry } = tree.readTaskEntry(memory, taskEntry);
  const taskEntryV1 = node.setTaskEntryTag(freshTaskEntry, tag);
  const result = tree.replaceNode(freshTree, taskEntryV1);

  memory.write.setTreeAndSelectedPath(result.newTree, result.newPath);
}

export function taskEntrySetValueType(
  { memory }: InputActionScope,
  taskEntry: TaskEntry,
  valueType: TaskEntryValueType,
  rolloverBehaviorInput: TaskEntry["rolloverBehavior"] = taskEntry.rolloverBehavior,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshTaskEntry } = tree.readTaskEntry(memory, taskEntry);
  const rolloverBehavior = getTaskEntryValueRolloverBehavior(rolloverBehaviorInput);

  if (
    freshTaskEntry.valueType === valueType &&
    freshTaskEntry.rolloverBehavior === rolloverBehavior
  ) {
    return;
  }

  const taskEntryV1 = node.setTaskEntryValueType(freshTaskEntry, valueType);
  const taskEntryV2 = node.setTaskEntryRolloverBehavior(taskEntryV1, rolloverBehavior);
  const taskEntryV3 = node.tryPrefillCarryOverTaskEntryValueFromHistory(taskEntryV2);
  const newTree = tree.replaceTaskEntry(freshTree, taskEntryV3);

  memory.write.setTree(newTree);
}

function getTaskEntryValueRolloverBehavior(
  rolloverBehavior: TaskEntry["rolloverBehavior"],
): "MoveValueToHistory" | "CarryOverValue" {
  return rolloverBehavior === "CarryOverValue" ? "CarryOverValue" : "MoveValueToHistory";
}
