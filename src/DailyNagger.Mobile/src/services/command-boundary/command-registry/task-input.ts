import { command } from "../commandScopes";
import {
  taskEntrySetValue,
  taskItemDeleteOnce,
  taskItemSetDoneAndSetFocus,
  taskLogAddTaskStep,
} from "../commandHandlers";

export const taskInputCommandActions = {
  "task-log/add-task-step": command("task-input", taskLogAddTaskStep),
  "task-item/set-done-and-set-focus": command("task-input", taskItemSetDoneAndSetFocus),
  "task-item/delete-once": command("task-input", taskItemDeleteOnce),
  "task-entry/set-value": command("task-input", taskEntrySetValue),
} as const;
