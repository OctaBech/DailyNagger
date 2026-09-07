import { command } from "../commandScopes";
import {
  naggerPinSelected,
  naggerUnpinSelected,
  taskEntrySetValue,
  taskItemDeleteOnce,
  taskItemSetDoneAndSetFocus,
  taskLogAddTaskStep,
} from "../commandHandlers";

export const taskInputCommandActions = {
  "nagger/pin-selected": command("task-input", naggerPinSelected),
  "nagger/unpin-selected": command("task-input", naggerUnpinSelected),
  "task-log/add-task-step": command("task-input", taskLogAddTaskStep),
  "task-item/set-done-and-set-focus": command("task-input", taskItemSetDoneAndSetFocus),
  "task-item/delete-once": command("task-input", taskItemDeleteOnce),
  "task-entry/set-value": command("task-input", taskEntrySetValue),
} as const;
