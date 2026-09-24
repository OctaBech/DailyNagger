import {
  emptyInteractionStamp,
  taskItemClientModelExtensionDefaults,
  type TaskItem,
} from "@/models";
import type { Guid } from "@/shared";

type CreateTaskItemInput = {
  readonly id: Guid;
  readonly taskLogId: Guid;
  readonly parentTaskItemId: Guid | null;
  readonly name: string;
};

const taskItemTemplate = {
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
    isExpanded: false,
  },
} satisfies Omit<TaskItem, "id" | "taskLogId" | "parentTaskItemId" | "name">;

export function createTaskItem(input: CreateTaskItemInput): TaskItem {
  return {
    ...taskItemTemplate,
    id: input.id,
    taskLogId: input.taskLogId,
    parentTaskItemId: input.parentTaskItemId,
    name: input.name,
  };
}
