import {
  emptyInteractionStamp,
  nagPlanClientModelExtensionDefaults,
  naggerClientModelExtensionDefaults,
  taskEntryClientModelExtensionDefaults,
  taskItemClientModelExtensionDefaults,
  taskLogClientModelExtensionDefaults,
  type NagPlan,
  type Nagger,
  type TaskEntry,
  type TaskItem,
  type TaskLog,
} from "@/models";
import { newGuid, type Guid } from "@/shared";

export const NodeTemplates = {
  getNagPlan,
  getNagger,
  getTaskLog,
  getTaskItem,
  getTaskEntry,
} as const;

function getNagPlan(nags: Nagger[]): NagPlan {
  return {
    nags: nags,
    date: "editor",
    ...nagPlanClientModelExtensionDefaults,
  } satisfies NagPlan;
}

function getNagger(activeLogDueOn: string | null = null, title = ""): Nagger {
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
    taskLog: getTaskLog(naggerId),
    version: 0,
    ...naggerClientModelExtensionDefaults,
    clientProps: {
      ...naggerClientModelExtensionDefaults.clientProps,
      isExpanded: true,
    },
  } satisfies Nagger;
}

function getTaskLog(naggerId: Guid): TaskLog {
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
  } satisfies TaskLog;
}

function getTaskItem(taskLog: TaskLog, parentTaskItem: TaskItem | null = null): TaskItem {
  return {
    id: newGuid(),
    taskLogId: taskLog.id,
    parentTaskItemId: parentTaskItem?.id ?? null,
    name: "",
    tag: null,
    isDone: false,
    rolloverBehavior: "Keep",
    ...emptyInteractionStamp,
    descendantTaskItemCount: 0,
    doneDescendantTaskItemCount: 0,
    taskEntries: [],
    taskItems: [],
    ...taskItemClientModelExtensionDefaults,
    clientProps: {
      ...taskItemClientModelExtensionDefaults.clientProps,
      isExpanded: true,
    },
  } satisfies TaskItem;
}

function getTaskEntry(taskLog: TaskLog, parentTaskItem: TaskItem): TaskEntry {
  return {
    id: newGuid(),
    taskLogId: taskLog.id,
    parentTaskItemId: parentTaskItem.id,
    label: "",
    description: null,
    valueType: "Text",
    tag: null,
    value: null,
    lastTaskRunReferenceValue: null,
    rolloverBehavior: "MoveValueToHistory",
    ...emptyInteractionStamp,
    ...taskEntryClientModelExtensionDefaults,
  } satisfies TaskEntry;
}
