import type { TaskEntryValueType } from "@/api";
import {
  isTaskEntry,
  normalizeTaskEntryValue,
  type Nagger,
  type ScheduleRule,
  type SelectedDeleteContext,
  type SelectedMoveContext,
  type TaskEntry,
  type TaskItem,
  type TaskLog,
} from "@/models";
import { scheduleCalculator } from "@/services/schedule-calculator";
import { treeOperations } from "@/services/tree-operations";
import type { CultureSettings, Memory } from "../../contracts";

export type EditorActionScope = {
  readonly cultureSettings: CultureSettings;
  readonly memory: Memory;
};

type MoveDirection = "up" | "down";

export function editorMoveSelectedNodeUp(
  scope: EditorActionScope,
  moveContext: SelectedMoveContext,
): void {
  moveSelectedNode(scope, moveContext, "up");
}

export function editorMoveSelectedNodeDown(
  scope: EditorActionScope,
  moveContext: SelectedMoveContext,
): void {
  moveSelectedNode(scope, moveContext, "down");
}

function moveSelectedNode(
  { memory }: EditorActionScope,
  moveContext: SelectedMoveContext,
  direction: MoveDirection,
): void {
  if (direction === "up" && moveContext.selectedIndex === 0) return;
  if (direction === "down" && moveContext.selectedIndex === moveContext.siblingCount - 1) return;

  const { node, tree } = treeOperations;
  const { freshTree, freshNode: parentNodeV1 } = tree.readNode(memory, moveContext.parentNode);
  const parentNodeV2 = node.moveChild(parentNodeV1, moveContext.selectedNode, direction);
  const result = tree.replaceNode(freshTree, parentNodeV2);

  memory.write.setTreeAndSelectedPath(result.newTree, [
    moveContext.selectedNode,
    ...result.newPath,
  ]);
}

export function editorDeleteSelectedNode(
  { memory }: EditorActionScope,
  deleteContext: SelectedDeleteContext,
): void {
  const { branch, tree } = treeOperations;
  const { freshTree, freshNode } = tree.readNode(memory, deleteContext.selectedNode);
  const result = isTaskEntry(freshNode)
    ? branch.deleteTaskEntry(freshTree, freshNode)
    : branch.deleteTaskItemSubtree(freshTree, freshNode);

  memory.write.setTreeAndSelectedPath(result.newTree, result.newPath);
}

export function editorDeleteOnceTaskItem(
  { memory }: EditorActionScope,
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
}

export function editorTaskEntrySetValue(
  { memory }: EditorActionScope,
  taskEntry: TaskEntry,
  newValue: string | null,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshTaskEntry } = tree.readTaskEntry(memory, taskEntry);
  const normalizedValue = normalizeTaskEntryValue(freshTaskEntry.valueType, newValue);

  const taskEntryV1 = node.setTaskEntryValue(freshTaskEntry, normalizedValue);
  const newTree = tree.replaceTaskEntry(freshTree, taskEntryV1);

  memory.write.setTree(newTree);
}

export function editorTaskItemSetName(
  { memory }: EditorActionScope,
  taskItem: TaskItem,
  name: string,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshTaskItem } = tree.readTaskItem(memory, taskItem);
  const taskItemV1 = node.setTaskItemName(freshTaskItem, name);
  const result = tree.replaceNode(freshTree, taskItemV1);

  memory.write.setTree(result.newTree);
}

export function editorTaskLogSetTag(
  { memory }: EditorActionScope,
  taskLog: TaskLog,
  tag: string | null,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshTaskLog } = tree.readTaskLog(memory, taskLog);
  const taskLogV1 = node.setTaskLogTag(freshTaskLog, tag);
  const result = tree.replaceNode(freshTree, taskLogV1);

  memory.write.setTreeAndSelectedPath(result.newTree, result.newPath);
}

export function editorTaskItemSetTag(
  { memory }: EditorActionScope,
  taskItem: TaskItem,
  tag: string | null,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshTaskItem } = tree.readTaskItem(memory, taskItem);
  const taskItemV1 = node.setTaskItemTag(freshTaskItem, tag);
  const result = tree.replaceNode(freshTree, taskItemV1);

  memory.write.setTreeAndSelectedPath(result.newTree, result.newPath);
}

export function editorNaggerSetTitle(
  { memory }: EditorActionScope,
  nagger: Nagger,
  title: string,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshNagger } = tree.readNagger(memory, nagger);
  const naggerV1 = node.setNaggerTitle(freshNagger, title);
  const result = tree.replaceNode(freshTree, naggerV1);

  memory.write.setTree(result.newTree);
}

export function editorNaggerSetScheduleRules(
  { cultureSettings, memory }: EditorActionScope,
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

export function editorNaggerSetTargetTime(
  { memory }: EditorActionScope,
  nagger: Nagger,
  targetTime: string | null,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshNagger } = tree.readNagger(memory, nagger);
  const naggerV1 = node.setNaggerTargetTime(freshNagger, targetTime);
  const result = tree.replaceNode(freshTree, naggerV1);

  memory.write.setTreeAndSelectedPath(result.newTree, result.newPath);
}

export function editorTaskEntrySetLabel(
  { memory }: EditorActionScope,
  taskEntry: TaskEntry,
  label: string,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshTaskEntry } = tree.readTaskEntry(memory, taskEntry);
  const taskEntryV1 = node.setTaskEntryLabel(freshTaskEntry, label);
  const result = tree.replaceNode(freshTree, taskEntryV1);

  memory.write.setTree(result.newTree);
}

export function editorTaskEntrySetTag(
  { memory }: EditorActionScope,
  taskEntry: TaskEntry,
  tag: string | null,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshTaskEntry } = tree.readTaskEntry(memory, taskEntry);
  const taskEntryV1 = node.setTaskEntryTag(freshTaskEntry, tag);
  const result = tree.replaceNode(freshTree, taskEntryV1);

  memory.write.setTreeAndSelectedPath(result.newTree, result.newPath);
}

export function editorTaskEntrySetValueType(
  { memory }: EditorActionScope,
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
