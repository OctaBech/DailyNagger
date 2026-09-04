import { emptyInteractionStamp, type TaskEntry, type TaskItem, type TaskLog } from "@/models";
import { newGuid, type Guid } from "@/shared";
import { tree } from "./tree";

export const rollover = {
  createTaskLog,
} as const;

function createTaskLog(sourceTaskLog: TaskLog): TaskLog {
  const newTaskLogId = newGuid();
  const taskItemIdMap = new Map<Guid, Guid>();
  const getNewTaskItemId = (oldId: Guid) => {
    const existingId = taskItemIdMap.get(oldId);
    if (existingId !== undefined) return existingId;

    const newId = newGuid();
    taskItemIdMap.set(oldId, newId);
    return newId;
  };

  return tree.replaceAllNodesFromTaskLog<TaskLog, TaskLog>(sourceTaskLog, {
    replaceTaskLog: (taskLog) => {
      const taskLogModel = taskLog as TaskLog;
      const taskItems = keepRolloverTaskItems(taskLogModel.taskItems);

      return {
        ...taskLogModel,
        id: newTaskLogId,
        copiedFromTaskLogId: sourceTaskLog.id,
        closedOn: null,
        version: 0,
        taskItems,
        descendantTaskItemCount: countTaskItems(taskItems),
        doneDescendantTaskItemCount: 0,
      };
    },
    replaceTaskItem: (taskItem) => {
      const taskItemModel = taskItem as TaskItem;
      const taskItems = keepRolloverTaskItems(taskItemModel.taskItems);

      return {
        ...taskItemModel,
        id: getNewTaskItemId(taskItemModel.id),
        taskLogId: newTaskLogId,
        parentTaskItemId:
          taskItemModel.parentTaskItemId === null
            ? null
            : getNewTaskItemId(taskItemModel.parentTaskItemId),
        isDone: false,
        taskEntries: taskItemModel.taskEntries,
        taskItems,
        ...emptyInteractionStamp,
        descendantTaskItemCount: countTaskItems(taskItems),
        doneDescendantTaskItemCount: 0,
      };
    },
    replaceTaskEntry: (taskEntry) => {
      const taskEntryModel = taskEntry as TaskEntry;
      const isCarryOver = taskEntryModel.rolloverBehavior === "CarryOverValue";

      return {
        ...taskEntryModel,
        id: newGuid(),
        taskLogId: newTaskLogId,
        parentTaskItemId: getNewTaskItemId(taskEntryModel.parentTaskItemId),
        value: isCarryOver ? taskEntryModel.value : null,
        lastTaskRunReferenceValue: taskEntryModel.value,
        ...emptyInteractionStamp,
      };
    },
  });
}

function keepRolloverTaskItems<TTaskItem extends TaskItem>(
  taskItems: readonly TTaskItem[],
): readonly TTaskItem[] {
  return taskItems.filter(
    (taskItem) => taskItem.rolloverBehavior !== "RemoveWhenDone" || taskItem.isDone === false,
  );
}

function countTaskItems(taskItems: readonly TaskItem[]): number {
  return taskItems.reduce((total, taskItem) => total + 1 + taskItem.descendantTaskItemCount, 0);
}
