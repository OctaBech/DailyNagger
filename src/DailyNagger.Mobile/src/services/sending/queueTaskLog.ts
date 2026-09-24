import type { TaskLogDto } from "@/api";
import { toJsonValue } from "@/shared";
import type { Formula } from "./contracts";

export function createTaskLogFormula(taskLog: TaskLogDto): Formula {
  return {
    type: "task-log-updated",
    label: "Task log",
    ownerType: "task-log",
    ownerId: taskLog.id,
    coalesceKey: `TaskLog:${taskLog.id}`,
    canBatch: false,
    sendMethod: "PUT",
    endpointPath: `/api/task-logs/${taskLog.id}`,
    recipientExpectsVersioning: true,
    payload: toJsonValue(taskLog),
  };
}
