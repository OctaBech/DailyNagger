import type { TaskEntryValueType } from "@/api";
import {
  isNagger,
  isTaskItem,
  isTaskLog,
  type TaskEntry,
  type TaskItem,
  type TaskLog,
  type Tree,
  type TreePath,
} from "@/models";
import { selectedPathOperations, treeMutationOperations } from "@/services/core-tree-operations";

export const editorOperations = {
  addTaskItemToTaskLog,
  addTaskItemToTaskItem,
  addTaskEntryToTaskItem,
  setNaggerTitle,
  setNaggerScheduleRules,
  setNaggerTargetTime,
  setTaskLogTag,
  setTaskItemName,
  setTaskItemTag,
  setTaskEntryLabel,
  setTaskEntryTag,
  setTaskEntryValueType,
  updateDescendantTaskItemCount,
  moveTaskEntryInTaskItem,
  moveTaskItemInTaskItem,
  moveTaskItemInTaskLog,
  deleteTaskItemFromTaskLog,
  deleteTaskItemFromTaskItem,
  deleteTaskEntryFromTaskItem,
} as const;

function addTaskItemToTaskLog(tree: Tree, taskLog: TaskLog, newTaskItem: TaskItem) {
  return treeMutationOperations.replaceTaskLog(tree, taskLog, (curTaskLog) => ({
    ...curTaskLog,
    taskItems: [...curTaskLog.taskItems, newTaskItem],
    clientProps: {
      ...curTaskLog.clientProps,
      isExpanded: true,
    },
  })).tree;
}

function addTaskItemToTaskItem(tree: Tree, taskItem: TaskItem, newTaskItem: TaskItem) {
  return treeMutationOperations.replaceTaskItem(tree, taskItem, (curTaskItem) => ({
    ...curTaskItem,
    taskItems: [...curTaskItem.taskItems, newTaskItem],
    clientProps: {
      ...curTaskItem.clientProps,
      isExpanded: true,
    },
  })).tree;
}

function addTaskEntryToTaskItem(tree: Tree, taskItem: TaskItem, newTaskEntry: TaskEntry) {
  return treeMutationOperations.replaceTaskItem(tree, taskItem, (taskItem) => ({
    ...taskItem,
    taskEntries: [...taskItem.taskEntries, newTaskEntry],
    clientProps: {
      ...taskItem.clientProps,
      isExpanded: true,
    },
  })).tree;
}

type Delta = number;
function updateDescendantTaskItemCount(tree: Tree, selectedPath: TreePath, delta: Delta) {
  let newTree = tree;

  for (const node of selectedPath) {
    if (isTaskItem(node)) {
      newTree = treeMutationOperations.replaceTaskItem(newTree, node as TaskItem, (taskItem) => {
        return {
          ...taskItem,
          descendantTaskItemCount: taskItem.descendantTaskItemCount + delta,
        };
      }).tree;
      continue;
    }

    if (isTaskLog(node)) {
      newTree = treeMutationOperations.replaceTaskLog(newTree, node, (taskLog) => {
        return { ...taskLog, descendantTaskItemCount: taskLog.descendantTaskItemCount + delta };
      }).tree;
      return newTree;
    }

    if (isNagger(node)) {
      newTree = treeMutationOperations.replaceTaskLog(newTree, node.taskLog, (taskLog) => {
        return { ...taskLog, descendantTaskItemCount: taskLog.descendantTaskItemCount + delta };
      }).tree;
      return newTree;
    }
  }
  throw new Error(
    "Cannot update descendant task item count because selected path does not contain the owning TaskLog.",
  );
}

function setTaskItemName(tree: Tree, taskItem: TaskItem, name: string) {
  return treeMutationOperations.replaceTaskItem(tree, taskItem, (curTaskItem) => ({
    ...curTaskItem,
    name,
  }));
}

function setNaggerTitle(tree: Tree, nagger: Tree["nags"][number], title: string) {
  return treeMutationOperations.replaceNagger(tree, nagger, (curNagger) => ({
    ...curNagger,
    title,
  }));
}

function setNaggerScheduleRules(
  tree: Tree,
  nagger: Tree["nags"][number],
  scheduleRules: Tree["nags"][number]["scheduleRules"],
  activeLogDueOn: Tree["nags"][number]["activeLogDueOn"],
) {
  return treeMutationOperations.replaceNagger(tree, nagger, (curNagger) => ({
    ...curNagger,
    scheduleRules,
    activeLogDueOn,
  }));
}

function setNaggerTargetTime(
  tree: Tree,
  nagger: Tree["nags"][number],
  targetTime: Tree["nags"][number]["targetTime"],
) {
  return treeMutationOperations.replaceNagger(tree, nagger, (curNagger) => ({
    ...curNagger,
    targetTime,
  }));
}

function setTaskEntryLabel(tree: Tree, taskEntry: TaskEntry, label: string) {
  return treeMutationOperations.replaceTaskEntry(tree, taskEntry, (curTaskEntry) => ({
    ...curTaskEntry,
    label,
  }));
}

function setTaskLogTag(tree: Tree, taskLog: TaskLog, tag: string | null) {
  return treeMutationOperations.replaceTaskLog(tree, taskLog, (curTaskLog) => ({
    ...curTaskLog,
    tag,
  }));
}

function setTaskItemTag(tree: Tree, taskItem: TaskItem, tag: string | null) {
  return treeMutationOperations.replaceTaskItem(tree, taskItem, (curTaskItem) => ({
    ...curTaskItem,
    tag,
  }));
}

function setTaskEntryTag(tree: Tree, taskEntry: TaskEntry, tag: string | null) {
  return treeMutationOperations.replaceTaskEntry(tree, taskEntry, (curTaskEntry) => ({
    ...curTaskEntry,
    tag,
  }));
}

function setTaskEntryValueType(tree: Tree, taskEntry: TaskEntry, valueType: TaskEntryValueType) {
  return treeMutationOperations.replaceTaskEntry(tree, taskEntry, (curTaskEntry) => ({
    ...curTaskEntry,
    valueType,
  }));
}

type MoveDirection = "up" | "down";
function moveTaskEntryInTaskItem(
  direction: MoveDirection,
  node: TaskEntry,
  parent: TaskItem,
  tree: Tree,
) {
  if (parent.taskEntries[parent.clientProps.indexHint].id !== node.id)
    throw new Error(
      `Cannot move TaskEntry:${node.id} because parent TaskItem:${parent.id} indexHint:${parent.clientProps.indexHint} does not point to that entry.`,
    );

  const moveResult = moveNodeInArray<TaskEntry>(
    parent.clientProps.indexHint,
    parent.taskEntries,
    direction,
  );

  const result = treeMutationOperations.replaceTaskItem(tree, parent, (taskItem) => {
    return {
      ...taskItem,
      taskEntries: moveResult.newArray,
      clientProps: { ...taskItem.clientProps, indexHint: moveResult.newIndex },
    };
  });

  return result;
}

function moveTaskItemInTaskItem(
  direction: MoveDirection,
  node: TaskItem,
  parent: TaskItem,
  tree: Tree,
) {
  if (parent.taskItems[parent.clientProps.indexHint].id !== node.id)
    throw new Error(
      `Cannot move TaskItem:${node.id} because parent TaskItem:${parent.id} indexHint:${parent.clientProps.indexHint} does not point to that child item.`,
    );

  const moveResult = moveNodeInArray<TaskItem>(
    parent.clientProps.indexHint,
    parent.taskItems,
    direction,
  );

  const result = treeMutationOperations.replaceTaskItem(tree, parent, (taskItem) => {
    return {
      ...taskItem,
      taskItems: moveResult.newArray,
      clientProps: { ...taskItem.clientProps, indexHint: moveResult.newIndex },
    };
  });

  return result;
}

function moveTaskItemInTaskLog(
  direction: MoveDirection,
  node: TaskItem,
  parent: TaskLog,
  tree: Tree,
) {
  if (parent.taskItems[parent.clientProps.indexHint].id !== node.id)
    throw new Error(
      `Cannot move TaskItem:${node.id} because parent TaskLog:${parent.id} indexHint:${parent.clientProps.indexHint} does not point to that child item.`,
    );

  const moveResult = moveNodeInArray<TaskItem>(
    parent.clientProps.indexHint,
    parent.taskItems,
    direction,
  );

  const result = treeMutationOperations.replaceTaskLog(tree, parent, (taskLog) => {
    return {
      ...taskLog,
      taskItems: moveResult.newArray,
      clientProps: { ...taskLog.clientProps, indexHint: moveResult.newIndex },
    };
  });

  return result;
}

function moveNodeInArray<T>(
  index: number,
  array: readonly T[],
  direction: MoveDirection,
): { newIndex: number; readonly newArray: readonly T[] } {
  if (direction === "up" && index === 0) return { newIndex: index, newArray: array };

  if (direction === "down" && index === array.length - 1)
    return { newIndex: index, newArray: array };

  const newIndex = index + (direction === "up" ? -1 : 1);
  const newArray = [...array];

  [newArray[newIndex], newArray[index]] = [newArray[index], newArray[newIndex]];

  return { newIndex, newArray };
}

function deleteTaskItemFromTaskLog(node: TaskItem, parent: TaskLog, tree: Tree) {
  let nextNodeToBeSelected: TaskItem | null = null;

  const { tree: newTree } = treeMutationOperations.replaceTaskLog(tree, parent, (taskLog) => {
    const indexHint = taskLog.clientProps.indexHint;

    if (taskLog.taskItems[indexHint]?.id !== node.id) {
      throw new Error(
        `Cannot delete TaskItem:${node.id} because parent TaskLog:${parent.id} indexHint:${indexHint} does not point to that child item.`,
      );
    }

    const newTaskItems = taskLog.taskItems.toSpliced(indexHint, 1);
    const newIndexHint = Math.min(indexHint, Math.max(newTaskItems.length - 1, 0));

    nextNodeToBeSelected = newTaskItems[newIndexHint] ?? parent;

    const newTaskLog = {
      ...taskLog,
      taskItems: newTaskItems,
      clientProps: { ...taskLog.clientProps, indexHint: newIndexHint },
    };
    return newTaskLog;
  });

  const newTreePath =
    nextNodeToBeSelected !== null
      ? selectedPathOperations.refreshPathToNode(newTree, nextNodeToBeSelected)
      : selectedPathOperations.refreshPathToNode(newTree, parent);

  return { tree: newTree, treePath: newTreePath };
}

function deleteTaskItemFromTaskItem(node: TaskItem, parent: TaskItem, tree: Tree) {
  let nextNodeToBeSelected: TaskItem | null = null;

  const { tree: newTree } = treeMutationOperations.replaceTaskItem(tree, parent, (taskItem) => {
    const indexHint = taskItem.clientProps.indexHint;

    if (taskItem.taskItems[indexHint]?.id !== node.id) {
      throw new Error(
        `Cannot delete TaskItem:${node.id} because parent TaskItem:${parent.id} indexHint:${indexHint} does not point to that child item.`,
      );
    }

    const newTaskItems = taskItem.taskItems.toSpliced(indexHint, 1);
    const newIndexHint = Math.min(indexHint, Math.max(newTaskItems.length - 1, 0));

    nextNodeToBeSelected = newTaskItems[newIndexHint] ?? parent;

    const newTaskItem = {
      ...taskItem,
      taskItems: newTaskItems,
      clientProps: { ...taskItem.clientProps, indexHint: newIndexHint },
    };
    return newTaskItem;
  });

  const newTreePath =
    nextNodeToBeSelected !== null
      ? selectedPathOperations.refreshPathToNode(newTree, nextNodeToBeSelected)
      : selectedPathOperations.refreshPathToNode(newTree, parent);

  return { tree: newTree, treePath: newTreePath };
}

function deleteTaskEntryFromTaskItem(node: TaskEntry, parent: TaskItem, tree: Tree) {
  let nextNodeToBeSelected: TaskEntry | null = null;

  const { tree: newTree } = treeMutationOperations.replaceTaskItem(tree, parent, (taskItem) => {
    const indexHint = taskItem.clientProps.indexHint;

    if (taskItem.taskEntries[indexHint]?.id !== node.id) {
      throw new Error(
        `Cannot delete TaskEntry:${node.id} because parent TaskItem:${parent.id} indexHint:${indexHint} does not point to that entry.`,
      );
    }

    const newTaskEntries = taskItem.taskEntries.toSpliced(indexHint, 1);
    const newIndexHint = Math.min(indexHint, Math.max(newTaskEntries.length - 1, 0));

    nextNodeToBeSelected = newTaskEntries[newIndexHint] ?? parent;

    const newTaskItem = {
      ...taskItem,
      taskEntries: newTaskEntries,
      clientProps: { ...taskItem.clientProps, indexHint: newIndexHint },
    };
    return newTaskItem;
  });

  const newTreePath =
    nextNodeToBeSelected !== null
      ? selectedPathOperations.refreshPathToNode(newTree, nextNodeToBeSelected)
      : selectedPathOperations.refreshPathToNode(newTree, parent);

  return { tree: newTree, treePath: newTreePath };
}
