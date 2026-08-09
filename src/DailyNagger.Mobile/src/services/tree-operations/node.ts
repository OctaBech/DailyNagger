import { emptyInteractionStamp, type Nagger, type TaskEntry, type TaskItem, type TaskLog } from "@/models";
import { newGuid, type Guid } from "@/shared";
import { treeCountOperations } from "@/services/core-tree-operations";

export const node = {
  attachTaskLog,
  closeTaskLogForNaggerHistory,
  createRolledOverTaskLog,
  isTaskLogClosed,
  setTaskEntryValue,
  setTaskItemDone,
} as const;

function attachTaskLog(nagger: Nagger, taskLog: TaskLog, activeLogDueOn: string | null): Nagger {
  return {
    ...nagger,
    activeLogDueOn,
    taskLog,
  };
}

function setTaskEntryValue(taskEntry: TaskEntry, value: string | null): TaskEntry {
  return {
    ...taskEntry,
    value,
  };
}

function closeTaskLogForNaggerHistory(taskLog: TaskLog, nagger: Nagger): TaskLog {
  if (nagger.activeLogDueOn === null) {
    throw new Error(`Cannot close TaskLog '${taskLog.id}' because Nagger '${nagger.id}' has no active log due date.`);
  }

  return {
    ...taskLog,
    closedOn: new Date().toISOString(),
  };
}

function createRolledOverTaskLog(sourceTaskLog: TaskLog): TaskLog {
  const newTaskLogId = newGuid();
  const taskItemIdMap = new Map<Guid, Guid>();
  const getNewTaskItemId = (oldId: Guid) => {
    const existingId = taskItemIdMap.get(oldId);
    if (existingId !== undefined) return existingId;

    const newId = newGuid();
    taskItemIdMap.set(oldId, newId);
    return newId;
  };

  const taskItems = keepRolloverTaskItems(sourceTaskLog.taskItems).map((taskItem) =>
    rollOverTaskItem(taskItem, newTaskLogId, getNewTaskItemId),
  );

  return {
    ...sourceTaskLog,
    id: newTaskLogId,
    copiedFromTaskLogId: sourceTaskLog.id,
    closedOn: null,
    version: 0,
    taskItems,
    descendantTaskItemCount: treeCountOperations.countTaskItems(taskItems),
    doneDescendantTaskItemCount: 0,
  };
}

function isTaskLogClosed(taskLog: TaskLog): boolean {
  return taskLog.closedOn !== null;
}

function setTaskItemDone(taskItem: TaskItem, isDone: boolean): TaskItem {
  if (taskItem.isDone === isDone) return taskItem;

  return {
    ...taskItem,
    isDone,
  };
}

type RolloverTaskItem = TaskItem & {
  readonly taskItems: readonly RolloverTaskItem[];
  readonly taskEntries: readonly TaskEntry[];
};

function rollOverTaskItem(
  taskItem: RolloverTaskItem,
  newTaskLogId: Guid,
  getNewTaskItemId: (oldId: Guid) => Guid,
): TaskItem {
  const taskItems = keepRolloverTaskItems(taskItem.taskItems).map((childTaskItem) =>
    rollOverTaskItem(childTaskItem, newTaskLogId, getNewTaskItemId),
  );
  const taskEntries = keepRolloverTaskEntries(taskItem.taskEntries).map((taskEntry) =>
    rollOverTaskEntry(taskEntry, newTaskLogId, getNewTaskItemId),
  );

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
}

function rollOverTaskEntry(
  taskEntry: TaskEntry,
  newTaskLogId: Guid,
  getNewTaskItemId: (oldId: Guid) => Guid,
): TaskEntry {
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
}

function keepRolloverTaskItems<TTaskItem extends TaskItem>(
  taskItems: readonly TTaskItem[],
): readonly TTaskItem[] {
  return taskItems.filter(
    (taskItem) => taskItem.rolloverBehavior !== "RemoveWhenDone" || taskItem.isDone === false,
  );
}

function keepRolloverTaskEntries<TTaskEntry extends TaskEntry>(
  taskEntries: readonly TTaskEntry[],
): readonly TTaskEntry[] {
  return taskEntries.filter((taskEntry) => taskEntry.rolloverBehavior !== "Remove");
}
