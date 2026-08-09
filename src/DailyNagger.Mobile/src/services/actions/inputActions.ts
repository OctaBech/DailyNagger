import type { TaskEntryValueType } from "@/api";
import type {
  Nagger,
  ScheduleRule,
  TaskEntry,
  TaskItem,
  TaskLog,
} from "@/models";
import { NodeTemplates } from "@/services/core-node-templates";
import { selectedPathOperations } from "@/services/core-tree-operations";
import { editorOperations, inputOperations } from "@/services/operations";
import { scheduleCalculator } from "@/services/schedule-calculator";
import { treeOperations } from "@/services/tree-operations";
import type { CultureSettings, InteractionStamp, Memory, Sending } from "../contracts";

export type InputActionScope = {
  readonly cultureSettings: CultureSettings;
  readonly memory: Memory;
  readonly sending: Sending;
  readonly interactionStamp: InteractionStamp | null;
};

export function taskEntrySetValue(
  { memory, sending, interactionStamp }: InputActionScope,
  taskEntry: TaskEntry,
  newValue: string | null,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshTaskEntry } = tree.readTaskEntry(memory, taskEntry);
  const normalizedValue = inputOperations.normalizeInputValue(
    freshTaskEntry.valueType,
    newValue,
  );

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
  const currentTree = memory.read.getTree();
  const taskLogPath = selectedPathOperations.refreshPathToNode(currentTree, taskLog);
  const { taskLog: currentTaskLog } = selectedPathOperations.deriveSelectedNodes(taskLogPath);

  if (currentTaskLog === null) {
    throw new Error("Cannot add TaskStep because the target TaskLog was not found.");
  }

  const taskItemWithoutStamp: TaskItem = {
    ...NodeTemplates.getTaskItem(currentTaskLog),
    name,
    rolloverBehavior,
  };
  const newTaskItem =
    interactionStamp === null ? taskItemWithoutStamp : interactionStamp.applyTo(taskItemWithoutStamp);

  const treeWithNewTaskItem = editorOperations.addTaskItemToTaskLog(
    currentTree,
    currentTaskLog,
    newTaskItem,
  );
  const treeWithUpdatedDescendantCount = editorOperations.updateDescendantTaskItemCount(
    treeWithNewTaskItem,
    taskLogPath,
    +1,
  );
  const newTaskItemPath = selectedPathOperations.refreshPathToNode(
    treeWithUpdatedDescendantCount,
    newTaskItem,
  );
  const { taskLog: updatedTaskLog } = selectedPathOperations.deriveSelectedNodes(newTaskItemPath);

  if (updatedTaskLog === null) {
    throw new Error("Cannot queue TaskLog update because the new TaskStep has no TaskLog.");
  }

  memory.write.setTreeAndSelectedPath(treeWithUpdatedDescendantCount, newTaskItemPath);
  sending.queue(updatedTaskLog);
}

export function taskItemAddQuickNote(
  { memory, sending, interactionStamp }: InputActionScope,
  taskItem: TaskItem,
): void {
  const currentTree = memory.read.getTree();
  const taskItemPath = selectedPathOperations.refreshPathToNode(currentTree, taskItem);
  const { taskLog: currentTaskLog, taskItem: currentTaskItem } =
    selectedPathOperations.deriveSelectedNodes(taskItemPath);

  if (currentTaskLog === null || currentTaskItem === null) {
    throw new Error("Cannot add Quick Note because the target TaskItem was not found.");
  }

  const taskEntryWithoutStamp: TaskEntry = {
    ...NodeTemplates.getTaskEntry(currentTaskLog, currentTaskItem),
    label: "Note",
    rolloverBehavior: "CarryOverValue",
  };
  const newTaskEntry =
    interactionStamp === null
      ? taskEntryWithoutStamp
      : interactionStamp.applyTo(taskEntryWithoutStamp);

  const treeWithNewTaskEntry = editorOperations.addTaskEntryToTaskItem(
    currentTree,
    currentTaskItem,
    newTaskEntry,
  );
  const newTaskEntryPath = selectedPathOperations.refreshPathToNode(
    treeWithNewTaskEntry,
    newTaskEntry,
  );
  const { taskLog: updatedTaskLog } = selectedPathOperations.deriveSelectedNodes(newTaskEntryPath);

  if (updatedTaskLog === null) {
    throw new Error("Cannot queue TaskLog update because the Quick Note has no TaskLog.");
  }

  memory.write.setTreeAndSelectedPath(treeWithNewTaskEntry, newTaskEntryPath);
  sending.queue(updatedTaskLog);
}

export function taskItemSetName(
  { memory }: InputActionScope,
  taskItem: TaskItem,
  name: string,
): void {
  const currentTree = memory.read.getTree();
  const { tree } = editorOperations.setTaskItemName(currentTree, taskItem, name);

  memory.write.setTree(tree);
}

export function taskLogSetTag(
  { memory }: InputActionScope,
  taskLog: TaskLog,
  tag: string | null,
): void {
  const currentTree = memory.read.getTree();
  const { tree, treePath } = editorOperations.setTaskLogTag(currentTree, taskLog, tag);

  memory.write.setTreeAndSelectedPath(tree, treePath);
}

export function taskItemSetTag(
  { memory }: InputActionScope,
  taskItem: TaskItem,
  tag: string | null,
): void {
  const currentTree = memory.read.getTree();
  const { tree, treePath } = editorOperations.setTaskItemTag(currentTree, taskItem, tag);

  memory.write.setTreeAndSelectedPath(tree, treePath);
}

export function naggerSetTitle(
  { memory }: InputActionScope,
  nagger: Nagger,
  title: string,
): void {
  const currentTree = memory.read.getTree();
  const { tree } = editorOperations.setNaggerTitle(currentTree, nagger, title);

  memory.write.setTree(tree);
}

export function naggerSetScheduleRules(
  { cultureSettings, memory }: InputActionScope,
  nagger: Nagger,
  scheduleRules: readonly ScheduleRule[],
): void {
  const currentTree = memory.read.getTree();
  const activeLogDueOn = scheduleCalculator.getNextDueOn(
    { ...nagger, scheduleRules },
    cultureSettings,
  );
  const { tree, treePath } = editorOperations.setNaggerScheduleRules(
    currentTree,
    nagger,
    scheduleRules,
    activeLogDueOn,
  );

  memory.write.setTreeAndSelectedPath(tree, treePath);
}

export function naggerSetTargetTime(
  { memory }: InputActionScope,
  nagger: Nagger,
  targetTime: string | null,
): void {
  const currentTree = memory.read.getTree();
  const { tree, treePath } = editorOperations.setNaggerTargetTime(
    currentTree,
    nagger,
    targetTime,
  );

  memory.write.setTreeAndSelectedPath(tree, treePath);
}

export function taskEntrySetLabel(
  { memory }: InputActionScope,
  taskEntry: TaskEntry,
  label: string,
): void {
  const currentTree = memory.read.getTree();
  const { tree } = editorOperations.setTaskEntryLabel(currentTree, taskEntry, label);

  memory.write.setTree(tree);
}

export function taskEntrySetTag(
  { memory }: InputActionScope,
  taskEntry: TaskEntry,
  tag: string | null,
): void {
  const currentTree = memory.read.getTree();
  const { tree, treePath } = editorOperations.setTaskEntryTag(currentTree, taskEntry, tag);

  memory.write.setTreeAndSelectedPath(tree, treePath);
}

export function taskEntrySetValueType(
  { memory }: InputActionScope,
  taskEntry: TaskEntry,
  valueType: TaskEntryValueType,
): void {
  const currentTree = memory.read.getTree();
  const { tree, treePath } = editorOperations.setTaskEntryValueType(
    currentTree,
    taskEntry,
    valueType,
  );

  memory.write.setTreeAndSelectedPath(tree, treePath);
}
