import {
  naggerClientModelExtensionDefaults,
  taskLogClientModelExtensionDefaults,
  type Nagger,
  type TaskEntry,
  type TaskItem,
  type TaskLog,
} from "@/models";
import { newGuid, type Guid } from "@/shared";
import { nodeTemplates } from "./node-templates";

export const node = {
  attachTaskLog,
  closeTaskLogForNaggerHistory,
  copyNaggerVersionFrom,
  copyTaskLogVersionFrom,
  createNagger,
  createTaskEntry,
  createTaskItem,
  isTaskLogClosed,
  moveChild,
  setNaggerExpanded,
  setNaggerScheduleRules,
  setNaggerTargetTime,
  setNaggerTitle,
  setTaskEntryValue,
  setTaskEntryRolloverBehavior,
  setTaskEntryLabel,
  setTaskEntryTag,
  setTaskEntryValueType,
  setNaggerPinnedBy,
  tryPrefillCarryOverTaskEntryValueFromHistory,
  setTaskItemDone,
  setTaskItemExpanded,
  setTaskItemName,
  setTaskItemRolloverBehavior,
  setTaskItemTag,
  setTaskLogTag,
} as const;

function attachTaskLog(nagger: Nagger, taskLog: TaskLog, activeLogDueOn: string | null): Nagger {
  return {
    ...nagger,
    activeLogDueOn,
    taskLog,
  };
}

function copyNaggerVersionFrom(nagger: Nagger, source: Nagger | null): Nagger {
  return {
    ...nagger,
    version: source?.version ?? 0,
  };
}

function copyTaskLogVersionFrom(taskLog: TaskLog, source: TaskLog | null): TaskLog {
  return {
    ...taskLog,
    updatedAt: source?.updatedAt ?? taskLog.updatedAt,
    version: source?.version ?? 0,
  };
}

function createNagger(activeLogDueOn: string | null = null, title = ""): Nagger {
  const naggerId = newGuid();

  return {
    id: naggerId,
    title,
    updatedAt: new Date().toISOString(),
    updatedByClientId: null,
    updatedByDeviceName: null,
    updatedByDeviceModel: null,
    activeLogDueOn,
    expiresOn: null,
    targetTime: null,
    isDeactivated: false,
    pinnedBy: "None",
    scheduleRules: [],
    taskLog: createTaskLog(naggerId),
    version: 0,
    ...naggerClientModelExtensionDefaults,
    clientProps: {
      ...naggerClientModelExtensionDefaults.clientProps,
      isExpanded: true,
    },
  };
}

function createTaskLog(naggerId: Guid): TaskLog {
  return {
    id: newGuid(),
    nagId: naggerId,
    copiedFromTaskLogId: null,
    closedOn: null,
    tag: null,
    updatedAt: new Date().toISOString(),
    updatedByClientId: null,
    updatedByDeviceName: null,
    updatedByDeviceModel: null,
    version: 0,
    descendantTaskItemCount: 0,
    doneDescendantTaskItemCount: 0,
    taskItems: [],
    ...taskLogClientModelExtensionDefaults,
    clientProps: {
      ...taskLogClientModelExtensionDefaults.clientProps,
      isExpanded: true,
    },
  };
}

function setNaggerPinnedBy(nagger: Nagger, pinnedBy: Nagger["pinnedBy"]): Nagger {
  if (nagger.pinnedBy === pinnedBy) return nagger;

  return {
    ...nagger,
    pinnedBy,
  };
}

function setNaggerExpanded(nagger: Nagger, isExpanded: boolean): Nagger {
  if (nagger.clientProps.isExpanded === isExpanded) return nagger;

  return {
    ...nagger,
    clientProps: {
      ...nagger.clientProps,
      isExpanded,
    },
  };
}

function setNaggerTitle(nagger: Nagger, title: string): Nagger {
  if (nagger.title === title) return nagger;

  return {
    ...nagger,
    title,
  };
}

function setNaggerScheduleRules(
  nagger: Nagger,
  scheduleRules: Nagger["scheduleRules"],
  activeLogDueOn: Nagger["activeLogDueOn"],
): Nagger {
  return {
    ...nagger,
    scheduleRules,
    activeLogDueOn,
  };
}

function setNaggerTargetTime(nagger: Nagger, targetTime: Nagger["targetTime"]): Nagger {
  if (nagger.targetTime === targetTime) return nagger;

  return {
    ...nagger,
    targetTime,
  };
}

function setTaskLogTag(taskLog: TaskLog, tag: TaskLog["tag"]): TaskLog {
  if (taskLog.tag === tag) return taskLog;

  return {
    ...taskLog,
    tag,
  };
}

function setTaskEntryValue(taskEntry: TaskEntry, value: string | null): TaskEntry {
  return {
    ...taskEntry,
    value,
  };
}

function setTaskEntryLabel(taskEntry: TaskEntry, label: string): TaskEntry {
  if (taskEntry.label === label) return taskEntry;

  return {
    ...taskEntry,
    label,
  };
}

function setTaskEntryTag(taskEntry: TaskEntry, tag: TaskEntry["tag"]): TaskEntry {
  if (taskEntry.tag === tag) return taskEntry;

  return {
    ...taskEntry,
    tag,
  };
}

function setTaskEntryValueType(taskEntry: TaskEntry, valueType: TaskEntry["valueType"]): TaskEntry {
  if (taskEntry.valueType === valueType) return taskEntry;

  return {
    ...taskEntry,
    valueType,
  };
}

function setTaskEntryRolloverBehavior(
  taskEntry: TaskEntry,
  rolloverBehavior: TaskEntry["rolloverBehavior"],
): TaskEntry {
  if (taskEntry.rolloverBehavior === rolloverBehavior) return taskEntry;

  return {
    ...taskEntry,
    rolloverBehavior,
  };
}

function tryPrefillCarryOverTaskEntryValueFromHistory(taskEntry: TaskEntry): TaskEntry {
  if (taskEntry.rolloverBehavior !== "CarryOverValue") return taskEntry;
  if (taskEntry.value !== null) return taskEntry;
  if (taskEntry.lastTaskRunReferenceValue === null) return taskEntry;

  return {
    ...taskEntry,
    value: taskEntry.lastTaskRunReferenceValue,
  };
}

function closeTaskLogForNaggerHistory(taskLog: TaskLog, nagger: Nagger): TaskLog {
  if (nagger.activeLogDueOn === null) {
    throw new Error(
      `Cannot close TaskLog '${taskLog.id}' because Nagger '${nagger.id}' has no active log due date.`,
    );
  }

  return {
    ...taskLog,
    closedOn: new Date().toISOString(),
  };
}

function isTaskLogClosed(taskLog: TaskLog): boolean {
  return taskLog.closedOn !== null;
}

type CreateTaskItemInput = {
  readonly taskLogId: Guid;
  readonly parentTaskItemId: Guid | null;
};

type CreateTaskEntryInput = {
  readonly taskLogId: Guid;
  readonly parentTaskItemId: Guid;
};

type MoveDirection = "up" | "down";

function createTaskItem({ taskLogId, parentTaskItemId }: CreateTaskItemInput): TaskItem {
  return nodeTemplates.createTaskItem({
    id: newGuid(),
    taskLogId,
    parentTaskItemId,
    name: "",
  });
}

function createTaskEntry({ taskLogId, parentTaskItemId }: CreateTaskEntryInput): TaskEntry {
  return nodeTemplates.createTaskEntry({
    id: newGuid(),
    taskLogId,
    parentTaskItemId,
    label: "",
  });
}

function moveChild(parent: TaskLog, child: TaskItem, direction: MoveDirection): TaskLog;
function moveChild(
  parent: TaskItem,
  child: TaskEntry | TaskItem,
  direction: MoveDirection,
): TaskItem;
function moveChild(
  parent: TaskItem | TaskLog,
  child: TaskEntry | TaskItem,
  direction: MoveDirection,
): TaskItem | TaskLog;
function moveChild(
  parent: TaskItem | TaskLog,
  child: TaskEntry | TaskItem,
  direction: MoveDirection,
): TaskItem | TaskLog {
  if (child.nodeType === "TaskEntry") {
    if (parent.nodeType !== "TaskItem") {
      throw new Error(`Cannot move TaskEntry '${child.id}' under TaskLog '${parent.id}'.`);
    }

    const moveResult = moveNodeInArray(parent.taskEntries, child, direction);

    return {
      ...parent,
      taskEntries: moveResult.newArray,
      clientProps: { ...parent.clientProps, indexHint: moveResult.newIndex },
    };
  }

  const moveResult = moveNodeInArray(parent.taskItems, child, direction);

  return {
    ...parent,
    taskItems: moveResult.newArray,
    clientProps: { ...parent.clientProps, indexHint: moveResult.newIndex },
  };
}

function moveNodeInArray<TNode extends TaskEntry | TaskItem>(
  nodes: readonly TNode[],
  node: TNode,
  direction: MoveDirection,
): { readonly newArray: readonly TNode[]; readonly newIndex: number } {
  const index = nodes.findIndex((candidate) => candidate.id === node.id);

  if (index === -1) {
    throw new Error(`${node.nodeType} '${node.id}' was not found in its parent collection.`);
  }

  if (direction === "up" && index === 0) return { newArray: nodes, newIndex: index };
  if (direction === "down" && index === nodes.length - 1) {
    return { newArray: nodes, newIndex: index };
  }

  const newIndex = index + (direction === "up" ? -1 : 1);
  const newArray = nodes.slice();

  [newArray[index], newArray[newIndex]] = [newArray[newIndex], newArray[index]];

  return { newArray, newIndex };
}

function setTaskItemDone(taskItem: TaskItem, isDone: boolean): TaskItem {
  if (taskItem.isDone === isDone) return taskItem;

  return {
    ...taskItem,
    isDone,
  };
}

function setTaskItemExpanded(taskItem: TaskItem, isExpanded: boolean): TaskItem {
  if (taskItem.clientProps.isExpanded === isExpanded) return taskItem;

  return {
    ...taskItem,
    clientProps: {
      ...taskItem.clientProps,
      isExpanded,
    },
  };
}

function setTaskItemName(taskItem: TaskItem, name: string): TaskItem {
  if (taskItem.name === name) return taskItem;

  return {
    ...taskItem,
    name,
  };
}

function setTaskItemTag(taskItem: TaskItem, tag: TaskItem["tag"]): TaskItem {
  if (taskItem.tag === tag) return taskItem;

  return {
    ...taskItem,
    tag,
  };
}

function setTaskItemRolloverBehavior(
  taskItem: TaskItem,
  rolloverBehavior: TaskItem["rolloverBehavior"],
): TaskItem {
  if (taskItem.rolloverBehavior === rolloverBehavior) return taskItem;

  return {
    ...taskItem,
    rolloverBehavior,
  };
}
