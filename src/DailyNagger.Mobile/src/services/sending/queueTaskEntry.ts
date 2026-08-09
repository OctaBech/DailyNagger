import type { TaskEntry } from "@/models";
import { toJsonValue } from "@/shared";
import type { Formula } from "./contracts";

export function createTaskEntryFormula(taskEntry: TaskEntry): Formula {
  return {
    type: "task-entry-updated",
    label: taskEntry.label.trim() || "Task entry",
    ownerType: "task-log",
    ownerId: taskEntry.taskLogId,
    coalesceKey: `TaskEntry:${taskEntry.id}`,
    canBatch: true,
    sendMethod: "PATCH",
    endpointPath: `/api/task-logs/${taskEntry.taskLogId}/task-entries`,
    recipientExpectsVersioning: true,
    payload: toJsonValue({
      id: taskEntry.id,
      value: taskEntry.value,
      interactionAt: taskEntry.interactionAt,
      interactionTimeZone: taskEntry.interactionTimeZone,
      interactionLocale: taskEntry.interactionLocale,
      interactionMood: taskEntry.interactionMood,
      interactionMoodAt: taskEntry.interactionMoodAt,
    }),
  };
}
