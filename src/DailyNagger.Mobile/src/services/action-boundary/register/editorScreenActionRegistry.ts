import { editorActions, editorSessionActions, navigationActions } from "@/services/actions";
import { registerAction } from "./actionRegistrationModel";

export const editorScreenActionRegistry = {
  effects: {
    startEdit: registerAction(editorSessionActions.editorStartEdit, "editor/session"),
  },
  nagger: {
    setExpanded: registerAction(navigationActions.naggerSetExpanded, "editor/navigation"),
    setFocused: registerAction(navigationActions.naggerSetFocused, "editor/navigation"),
    setScheduleRules: registerAction(editorActions.editorNaggerSetScheduleRules, "editor/action"),
    setTargetTime: registerAction(editorActions.editorNaggerSetTargetTime, "editor/action"),
    setTitle: registerAction(editorActions.editorNaggerSetTitle, "editor/action"),
  },
  taskEntry: {
    setFocused: registerAction(navigationActions.taskEntrySetFocused, "editor/navigation"),
    setLabel: registerAction(editorActions.editorTaskEntrySetLabel, "editor/action"),
    setTag: registerAction(editorActions.editorTaskEntrySetTag, "editor/action"),
    setValue: registerAction(editorActions.editorTaskEntrySetValue, "editor/action"),
    setValueType: registerAction(editorActions.editorTaskEntrySetValueType, "editor/action"),
  },
  taskItem: {
    addTaskEntry: registerAction(editorActions.addTaskEntryToTaskItem, "editor/action"),
    addTaskItem: registerAction(editorActions.addTaskItemToTaskItem, "editor/action"),
    deleteOnce: registerAction(editorActions.editorDeleteOnceTaskItem, "editor/action"),
    setExpanded: registerAction(navigationActions.taskItemSetExpanded, "editor/navigation"),
    setFocused: registerAction(navigationActions.taskItemSetFocused, "editor/navigation"),
    setName: registerAction(editorActions.editorTaskItemSetName, "editor/action"),
    setTag: registerAction(editorActions.editorTaskItemSetTag, "editor/action"),
  },
  taskLog: {
    addTaskItem: registerAction(editorActions.addTaskItemToTaskLog, "editor/action"),
    setFocused: registerAction(navigationActions.taskLogSetFocused, "editor/navigation"),
    setTag: registerAction(editorActions.editorTaskLogSetTag, "editor/action"),
  },
} as const;
