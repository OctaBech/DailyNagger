import { navigationActions, taskInputActions } from "@/services/actions";
import { registerAction } from "./actionRegistrationModel";

export const planScreenActionRegistry = {
  nagger: {
    setExpanded: registerAction(navigationActions.naggerSetExpanded, "plan/navigation"),
    setFocused: registerAction(navigationActions.naggerSetFocused, "plan/navigation"),
  },
  taskEntry: {
    setFocused: registerAction(navigationActions.taskEntrySetFocused, "plan/navigation"),
    setValue: registerAction(taskInputActions.taskEntrySetValue, "plan/task-input"),
  },
  taskItem: {
    deleteOnce: registerAction(taskInputActions.deleteOnceTaskItem, "plan/task-input"),
    setDoneAndSetFocus: registerAction(
      taskInputActions.taskItemSetDoneAndSetFocus,
      "plan/task-input",
    ),
    setExpanded: registerAction(navigationActions.taskItemSetExpanded, "plan/navigation"),
    setFocused: registerAction(navigationActions.taskItemSetFocused, "plan/navigation"),
  },
  taskLog: {
    addTaskStep: registerAction(taskInputActions.taskLogAddTaskStep, "plan/task-input"),
    setFocused: registerAction(navigationActions.taskLogSetFocused, "plan/navigation"),
  },
} as const;
