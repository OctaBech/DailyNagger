import {
  isTaskItem,
  isTaskLog,
  type TaskEntry,
  type TaskItem,
  type Tree,
  type TreePath,
} from "@/models";
import { normalizeInputValue } from "./normalizeInputValue";
import { treeMutationOperations } from "@/services/core-tree-operations";

export const inputOperations = {
  normalizeInputValue,
  replaceTaskEntry,
  setTaskItemDone,
  updateDoneDescendantTaskItemCount,
} as const;

function replaceTaskEntry(tree: Tree, updatedTaskEntry: TaskEntry) {
  return treeMutationOperations.replaceTaskEntry(tree, updatedTaskEntry, (taskEntry) => {
    return {
      ...taskEntry,
      value: updatedTaskEntry.value,
      interactionAt: updatedTaskEntry.interactionAt,
      interactionTimeZone: updatedTaskEntry.interactionTimeZone,
      interactionLocale: updatedTaskEntry.interactionLocale,
      interactionMood: updatedTaskEntry.interactionMood,
      interactionMoodAt: updatedTaskEntry.interactionMoodAt,
    };
  }).tree;
}

function setTaskItemDone(tree: Tree, updatedTaskItem: TaskItem) {
  return treeMutationOperations.replaceTaskItem(tree, updatedTaskItem, (taskItem) => {
    return {
      ...taskItem,
      isDone: updatedTaskItem.isDone,
      interactionAt: updatedTaskItem.interactionAt,
      interactionTimeZone: updatedTaskItem.interactionTimeZone,
      interactionLocale: updatedTaskItem.interactionLocale,
      interactionMood: updatedTaskItem.interactionMood,
      interactionMoodAt: updatedTaskItem.interactionMoodAt,
    };
  });
}

type Delta = number;
function updateDoneDescendantTaskItemCount(tree: Tree, selectedPath: TreePath, delta: Delta) {
  let newTree = tree;

  for (const node of selectedPath) {
    if (isTaskItem(node)) {
      newTree = treeMutationOperations.replaceTaskItem(newTree, node as TaskItem, (taskItem) => {
        return {
          ...taskItem,
          doneDescendantTaskItemCount: taskItem.doneDescendantTaskItemCount + delta,
        };
      }).tree;
      continue;
    }

    if (isTaskLog(node)) {
      newTree = treeMutationOperations.replaceTaskLog(newTree, node, (taskLog) => {
        return {
          ...taskLog,
          doneDescendantTaskItemCount: taskLog.doneDescendantTaskItemCount + delta,
        };
      }).tree;
      return newTree;
    }
  }
  throw new Error(
    "Cannot update done descendant task item count because selected path does not contain the owning TaskLog.",
  );
}
