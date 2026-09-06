import type { TaskEntry, TaskItem, TaskLog } from "@/models";

export type TaskLogAddTaskStepArgs = {
  readonly taskLog: TaskLog;
  readonly name: string;
  readonly rolloverBehavior: TaskItem["rolloverBehavior"];
};

export type TaskItemSetDoneAndSetFocusArgs = {
  readonly taskItem: TaskItem;
  readonly isDone: boolean;
};

export type TaskItemDeleteOnceArgs = {
  readonly taskItem: TaskItem;
};

export type TaskEntrySetValueArgs = {
  readonly taskEntry: TaskEntry;
  readonly newValue: string | null;
};
