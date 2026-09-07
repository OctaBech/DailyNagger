import { command } from "../commandScopes";
import { taskInputActions } from "../../actions";

export const taskInputCommandActions = {
  "nagger/pin-selected": command("task-input", taskInputActions.naggerPinSelected),
  "nagger/unpin-selected": command("task-input", taskInputActions.naggerUnpinSelected),
  "task-log/add-task-step": command("task-input", taskInputActions.taskLogAddTaskStep),
  "task-item/set-done-and-set-focus": command(
    "task-input",
    taskInputActions.taskItemSetDoneAndSetFocus,
  ),
  "task-item/delete-once": command("task-input", taskInputActions.deleteOnceTaskItem),
  "task-entry/set-value": command("task-input", taskInputActions.taskEntrySetValue),
} as const;
