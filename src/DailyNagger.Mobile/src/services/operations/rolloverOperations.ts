import { emptyInteractionStamp, type TaskLog, type Tree } from "@/models";
import {
  selectedPathOperations,
  treeCountOperations,
  treeMutationOperations,
  treeReadOperations,
} from "@/services/core-tree-operations";
import { newGuid, type Guid } from "@/shared";
import { scheduleCalculator } from "@/services/schedule-calculator";
import type { CultureSettings } from "@/services/culture";

export const rolloverOperations = { closeTaskLog, createNewLog, setNewDueDate };

function closeTaskLog(
  taskLog: TaskLog,
  tree: Tree,
  closedOnDate: string,
): { tree: Tree; closedTaskLog: TaskLog } {
  const { treePath, tree: newTree } = treeMutationOperations.replaceTaskLog(
    tree,
    taskLog,
    (taskLog) => {
      return { ...taskLog, closedOn: closedOnDate };
    },
  );

  const closedTaskLog = selectedPathOperations.requireSelectedTaskLog(treePath);

  return { tree: newTree, closedTaskLog };
}

function createNewLog(tree: Tree): Tree {
  const sourceTaskLogId = treeReadOperations.requireSingleNagger(tree).taskLog.id;

  const newTaskLogId = newGuid();
  const taskItemIdMap = new Map<Guid, Guid>();
  const getNewTaskItemId = (oldId: Guid) => {
    const existingId = taskItemIdMap.get(oldId);
    if (existingId !== undefined) return existingId;

    const newId = newGuid();
    taskItemIdMap.set(oldId, newId);
    return newId;
  };

  const { tree: newTree } = treeMutationOperations.replaceAll(
    tree,
    (nagPlan) => {
      return nagPlan;
    },
    (nagger) => {
      return nagger;
    },
    (taskLog) => {
      const taskItems = keepRolloverTaskItems(taskLog.taskItems);

      return {
        ...taskLog,
        id: newTaskLogId,
        copiedFromTaskLogId: sourceTaskLogId,
        closedOn: null,
        version: 0,
        taskItems,
        descendantTaskItemCount: treeCountOperations.countTaskItems(taskItems),
        doneDescendantTaskItemCount: 0,
      };
    },
    (taskItem) => {
      const taskItems = keepRolloverTaskItems(taskItem.taskItems);
      const taskEntries = keepRolloverTaskEntries(taskItem.taskEntries);

      return {
        ...taskItem,
        id: getNewTaskItemId(taskItem.id),
        taskLogId: newTaskLogId,
        parentTaskItemId:
          taskItem.parentTaskItemId === null ? null : getNewTaskItemId(taskItem.parentTaskItemId),
        isDone: false,
        taskEntries,
        taskItems,
        ...emptyInteractionStamp,
        descendantTaskItemCount: treeCountOperations.countTaskItems(taskItems),
        doneDescendantTaskItemCount: 0,
      };
    },
    (taskEntry) => {
      return {
        ...taskEntry,
        id: newGuid(),
        taskLogId: newTaskLogId,
        parentTaskItemId: getNewTaskItemId(taskEntry.parentTaskItemId),
        value: taskEntry.rolloverBehavior === "CarryOverValue" ? taskEntry.value : null,
        lastTaskRunReferenceValue:
          taskEntry.rolloverBehavior === "Remove" ? null : taskEntry.value,
        ...emptyInteractionStamp,
      };
    },
  );
  return newTree as Tree;
}

type RolloverTaskItem = {
  readonly rolloverBehavior: "Keep" | "RemoveWhenDone";
  readonly isDone: boolean;
  readonly taskEntries: readonly RolloverTaskEntry[];
  readonly taskItems: readonly RolloverTaskItem[];
};

type RolloverTaskEntry = {
  readonly rolloverBehavior: "MoveValueToHistory" | "CarryOverValue" | "Remove";
  readonly value: string | null;
};

function keepRolloverTaskItems<TTaskItem extends RolloverTaskItem>(
  taskItems: readonly TTaskItem[],
): readonly TTaskItem[] {
  return taskItems.filter(
    (taskItem) =>
      (taskItem.rolloverBehavior !== "RemoveWhenDone" || taskItem.isDone === false),
  );
}

function keepRolloverTaskEntries<TTaskEntry extends RolloverTaskEntry>(
  taskEntries: readonly TTaskEntry[],
): readonly TTaskEntry[] {
  return taskEntries.filter((taskEntry) => taskEntry.rolloverBehavior !== "Remove");
}

function setNewDueDate(tree: Tree, cultureSettings: CultureSettings): Tree {
  const nagger = treeReadOperations.requireSingleNagger(tree);
  const { tree: newTree } = treeMutationOperations.replaceNagger(tree, nagger, (nagger) => {
    return { ...nagger, activeLogDueOn: scheduleCalculator.getNextDueOn(nagger, cultureSettings) };
  });
  return newTree;
}
