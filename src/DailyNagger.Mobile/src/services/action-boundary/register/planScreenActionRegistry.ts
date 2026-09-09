import type { Nagger, TaskEntry, TaskItem, TaskLog } from "@/models";
import { navigationActions, taskInputActions } from "@/services/actions";
import { registerAction } from "./actionRegistrationModel";

export const planScreenActionRegistry = {
  nagger: {
    setExpanded: registerAction(
      "navigation",
      navigationActions.naggerSetExpanded,
      (nagger: Nagger, isExpanded: boolean) => ({ nagger, isExpanded }),
    ),
    setFocused: registerAction(
      "navigation",
      navigationActions.naggerSetFocused,
      (nagger: Nagger) => ({ nagger }),
    ),
  },
  taskEntry: {
    setFocused: registerAction(
      "navigation",
      navigationActions.taskEntrySetFocused,
      (taskEntry: TaskEntry) => ({ taskEntry }),
    ),
    setValue: registerAction(
      "task-input",
      taskInputActions.taskEntrySetValue,
      (taskEntry: TaskEntry, newValue: string | null) => ({ taskEntry, newValue }),
    ),
  },
  taskItem: {
    deleteOnce: registerAction(
      "task-input",
      taskInputActions.deleteOnceTaskItem,
      (taskItem: TaskItem) => ({ taskItem }),
    ),
    setDoneAndSetFocus: registerAction(
      "task-input",
      taskInputActions.taskItemSetDoneAndSetFocus,
      (taskItem: TaskItem, isDone: boolean) => ({ taskItem, isDone }),
    ),
    setExpanded: registerAction(
      "navigation",
      navigationActions.taskItemSetExpanded,
      (taskItem: TaskItem, isExpanded: boolean) => ({ taskItem, isExpanded }),
    ),
    setFocused: registerAction(
      "navigation",
      navigationActions.taskItemSetFocused,
      (taskItem: TaskItem) => ({ taskItem }),
    ),
  },
  taskLog: {
    addTaskStep: registerAction(
      "task-input",
      taskInputActions.taskLogAddTaskStep,
      (taskLog: TaskLog, name: string, rolloverBehavior: TaskItem["rolloverBehavior"]) => ({
        taskLog,
        name,
        rolloverBehavior,
      }),
    ),
    setFocused: registerAction(
      "navigation",
      navigationActions.taskLogSetFocused,
      (taskLog: TaskLog) => ({ taskLog }),
    ),
  },
} as const;

