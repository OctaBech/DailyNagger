import type { TaskEntryValueType } from "@/api";
import type { Nagger, ScheduleRule, TaskEntry, TaskItem, TaskLog } from "@/models";
import type { Guid } from "@/shared";
import { editorActions, editorSessionActions, navigationActions } from "@/services/actions";
import { registerAction } from "./actionRegistrationModel";

export const editorScreenActionRegistry = {
  effects: {
    startEdit: registerAction(
      "editor-session",
      editorSessionActions.editorStartEdit,
      (naggerId: Guid | null) => ({ naggerId }),
    ),
  },
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
    setScheduleRules: registerAction(
      "editor",
      editorActions.editorNaggerSetScheduleRules,
      (nagger: Nagger, scheduleRules: readonly ScheduleRule[]) => ({ nagger, scheduleRules }),
    ),
    setTargetTime: registerAction(
      "editor",
      editorActions.editorNaggerSetTargetTime,
      (nagger: Nagger, targetTime: string | null) => ({ nagger, targetTime }),
    ),
    setTitle: registerAction(
      "editor",
      editorActions.editorNaggerSetTitle,
      (nagger: Nagger, title: string) => ({ nagger, title }),
    ),
  },
  taskEntry: {
    setFocused: registerAction(
      "navigation",
      navigationActions.taskEntrySetFocused,
      (taskEntry: TaskEntry) => ({ taskEntry }),
    ),
    setLabel: registerAction(
      "editor",
      editorActions.editorTaskEntrySetLabel,
      (taskEntry: TaskEntry, label: string) => ({ taskEntry, label }),
    ),
    setTag: registerAction(
      "editor",
      editorActions.editorTaskEntrySetTag,
      (taskEntry: TaskEntry, tag: string | null) => ({ taskEntry, tag }),
    ),
    setValue: registerAction(
      "editor",
      editorActions.editorTaskEntrySetValue,
      (taskEntry: TaskEntry, newValue: string | null) => ({ taskEntry, newValue }),
    ),
    setValueType: registerAction(
      "editor",
      editorActions.editorTaskEntrySetValueType,
      (
        taskEntry: TaskEntry,
        valueType: TaskEntryValueType,
        rolloverBehavior?: TaskEntry["rolloverBehavior"],
      ) => ({ taskEntry, valueType, rolloverBehavior }),
    ),
  },
  taskItem: {
    addTaskEntry: registerAction(
      "editor",
      editorActions.addTaskEntryToTaskItem,
      (taskItem: TaskItem) => ({ taskItem }),
    ),
    addTaskItem: registerAction(
      "editor",
      editorActions.addTaskItemToTaskItem,
      (taskItem: TaskItem) => ({ taskItem }),
    ),
    deleteOnce: registerAction(
      "editor",
      editorActions.editorDeleteOnceTaskItem,
      (taskItem: TaskItem) => ({ taskItem }),
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
    setName: registerAction(
      "editor",
      editorActions.editorTaskItemSetName,
      (taskItem: TaskItem, name: string) => ({ taskItem, name }),
    ),
    setTag: registerAction(
      "editor",
      editorActions.editorTaskItemSetTag,
      (taskItem: TaskItem, tag: string | null) => ({ taskItem, tag }),
    ),
  },
  taskLog: {
    addTaskItem: registerAction(
      "editor",
      editorActions.addTaskItemToTaskLog,
      (taskLog: TaskLog) => ({ taskLog }),
    ),
    setFocused: registerAction(
      "navigation",
      navigationActions.taskLogSetFocused,
      (taskLog: TaskLog) => ({ taskLog }),
    ),
    setTag: registerAction(
      "editor",
      editorActions.editorTaskLogSetTag,
      (taskLog: TaskLog, tag: string | null) => ({ taskLog, tag }),
    ),
  },
} as const;
