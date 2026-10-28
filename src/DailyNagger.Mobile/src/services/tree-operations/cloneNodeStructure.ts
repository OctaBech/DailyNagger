import {
  emptyInteractionStamp,
  isTaskEntry,
  isTaskLog,
  taskEntryClientModelExtensionDefaults,
  taskItemClientModelExtensionDefaults,
  type TaskEntry,
  type TaskItem,
  type TaskLog,
} from "@/models";
import { newGuid, type Guid } from "@/shared";
import { targets } from "./tree-visitor";
import type { TaskEntryTraversedNode } from "./tree-visitor/traversed-node";

export function cloneNodeStructure(source: TaskItem, target: TaskItem | TaskLog): TaskItem;
export function cloneNodeStructure(source: TaskEntry, target: TaskItem): TaskEntry;
export function cloneNodeStructure(
  source: TaskItem | TaskEntry,
  target: TaskItem | TaskLog,
): TaskItem | TaskEntry;
export function cloneNodeStructure(
  source: TaskItem | TaskEntry,
  target: TaskItem | TaskLog,
): TaskItem | TaskEntry {
  if (isTaskEntry(source) && isTaskLog(target)) {
    throw new Error("Cannot clone a TaskEntry into a TaskLog.");
  }

  const targetTaskLogId = isTaskLog(target) ? target.id : target.taskLogId;
  const rootParentId = isTaskLog(target) ? null : target.id;
  const taskItemIds = new Map<Guid, Guid>();
  const getNewTaskItemId = (oldId: Guid): Guid => {
    let id = taskItemIds.get(oldId);
    if (id === undefined) {
      id = newGuid();
      taskItemIds.set(oldId, id);
    }
    return id;
  };

  const cloneEntry = (entry: TaskEntryTraversedNode): TaskEntry => ({
    ...entry,
    ...taskEntryClientModelExtensionDefaults,
    clientProps: { ...taskEntryClientModelExtensionDefaults.clientProps },
    id: newGuid(),
    taskLogId: targetTaskLogId,
    parentTaskItemId: isTaskEntry(source)
      ? (target as TaskItem).id
      : getNewTaskItemId(entry.parentTaskItemId),
    value: null,
    lastTaskRunReferenceValue: null,
    ...emptyInteractionStamp,
  });

  if (isTaskEntry(source)) return cloneEntry(source);

  const result = targets.visitWholeTaskItem(source, {
    visitTaskEntry: cloneEntry,
    visitTaskItem: (item) => ({
      ...item,
      ...taskItemClientModelExtensionDefaults,
      clientProps: { ...taskItemClientModelExtensionDefaults.clientProps },
      id: getNewTaskItemId(item.id),
      taskLogId: targetTaskLogId,
      parentTaskItemId:
        item.id === source.id
          ? rootParentId
          : item.parentTaskItemId === null
            ? null
            : getNewTaskItemId(item.parentTaskItemId),
      isDone: false,
      doneDescendantTaskItemCount: 0,
      ...emptyInteractionStamp,
    }),
  });

  if (result.kind === "not-found") throw new Error("Cannot clone: TaskItem was not visited.");

  // The input is a client model and both callbacks return complete client-model nodes.
  return result.node as TaskItem;
}
