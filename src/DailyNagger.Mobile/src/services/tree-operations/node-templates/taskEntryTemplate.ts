import {
  emptyInteractionStamp,
  taskEntryClientModelExtensionDefaults,
  type TaskEntry,
} from "@/models";
import type { Guid } from "@/shared";

type CreateTaskEntryInput = {
  readonly id: Guid;
  readonly taskLogId: Guid;
  readonly parentTaskItemId: Guid;
  readonly label: string;
};

const taskEntryTemplate = {
  description: null,
  valueType: "Text",
  tag: null,
  value: null,
  lastTaskRunReferenceValue: null,
  rolloverBehavior: "MoveValueToHistory",
  ...emptyInteractionStamp,
  ...taskEntryClientModelExtensionDefaults,
} satisfies Omit<TaskEntry, "id" | "taskLogId" | "parentTaskItemId" | "label">;

export function createTaskEntry(input: CreateTaskEntryInput): TaskEntry {
  return {
    ...taskEntryTemplate,
    id: input.id,
    taskLogId: input.taskLogId,
    parentTaskItemId: input.parentTaskItemId,
    label: input.label,
  };
}
