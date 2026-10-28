import { navigationActions, taskInputActions } from "@/services/actions";
import { addDemoData, deleteAllDemoData, switchDemoUser } from "@/services/actions/demoData";
import { registerAction } from "./actionRegistrationModel";

export const planScreenActionRegistry = {
  demo: {
    switchUser: registerAction(switchDemoUser, "plan/demo"),
    addData: registerAction(addDemoData, "plan/demo"),
    deleteAllData: registerAction(deleteAllDemoData, "plan/demo"),
  },
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
