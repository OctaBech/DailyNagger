import type { Nagger, TaskEntry, TaskItem, TaskLog } from "@/models";
import { navigationActions, taskInputActions } from "@/services/actions";
import { registerAction } from "./actionRegistrationModel";

export const planScreenActionRegistry = {
  nagger: {
    setExpanded: registerAction(
      navigationActions.naggerSetExpanded,
      (nagger: Nagger, isExpanded: boolean) => ({ nagger, isExpanded }),
      "plan/navigation",
    ),
    setFocused: registerAction(
      navigationActions.naggerSetFocused,
      (nagger: Nagger) => ({ nagger }),
      "plan/navigation",
    ),
  },
  taskEntry: {
    setFocused: registerAction(
      navigationActions.taskEntrySetFocused,
      (taskEntry: TaskEntry) => ({ taskEntry }),
      "plan/navigation",
    ),
    setValue: registerAction(
      taskInputActions.taskEntrySetValue,
      (taskEntry: TaskEntry, newValue: string | null) => ({ taskEntry, newValue }),
      "plan/task-input",
    ),
  },
  taskItem: {
    deleteOnce: registerAction(
      taskInputActions.deleteOnceTaskItem,
      (taskItem: TaskItem) => ({ taskItem }),
      "plan/task-input",
    ),
    setDoneAndSetFocus: registerAction(
      taskInputActions.taskItemSetDoneAndSetFocus,
      (taskItem: TaskItem, isDone: boolean) => ({ taskItem, isDone }),
      "plan/task-input",
    ),
    setExpanded: registerAction(
      navigationActions.taskItemSetExpanded,
      (taskItem: TaskItem, isExpanded: boolean) => ({ taskItem, isExpanded }),
      "plan/navigation",
    ),
    setFocused: registerAction(
      navigationActions.taskItemSetFocused,
      (taskItem: TaskItem) => ({ taskItem }),
      "plan/navigation",
    ),
  },
  taskLog: {
    addTaskStep: registerAction(
      taskInputActions.taskLogAddTaskStep,
      (taskLog: TaskLog, name: string, rolloverBehavior: TaskItem["rolloverBehavior"]) => ({
        taskLog,
        name,
        rolloverBehavior,
      }),
      "plan/task-input",
    ),
    setFocused: registerAction(
      navigationActions.taskLogSetFocused,
      (taskLog: TaskLog) => ({ taskLog }),
      "plan/navigation",
    ),
  },
} as const;
