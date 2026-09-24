import type { TaskEntryValueType } from "@/api";
import type { Nagger, ScheduleRule, TaskEntry, TaskItem, TaskLog } from "@/models";
import type { Guid } from "@/shared";
import { editorActions, editorSessionActions, navigationActions } from "@/services/actions";
import { registerAction } from "./actionRegistrationModel";

export const editorScreenActionRegistry = {
  effects: {
    startEdit: registerAction(
      editorSessionActions.editorStartEdit,
      (naggerId: Guid | null) => ({ naggerId }),
      "editor/session",
    ),
  },
  nagger: {
    setExpanded: registerAction(
      navigationActions.naggerSetExpanded,
      (nagger: Nagger, isExpanded: boolean) => ({ nagger, isExpanded }),
      "editor/navigation",
    ),
    setFocused: registerAction(
      navigationActions.naggerSetFocused,
      (nagger: Nagger) => ({ nagger }),
      "editor/navigation",
    ),
    setScheduleRules: registerAction(
      editorActions.editorNaggerSetScheduleRules,
      (nagger: Nagger, scheduleRules: readonly ScheduleRule[]) => ({ nagger, scheduleRules }),
      "editor/action",
    ),
    setTargetTime: registerAction(
      editorActions.editorNaggerSetTargetTime,
      (nagger: Nagger, targetTime: string | null) => ({ nagger, targetTime }),
      "editor/action",
    ),
    setTitle: registerAction(
      editorActions.editorNaggerSetTitle,
      (nagger: Nagger, title: string) => ({ nagger, title }),
      "editor/action",
    ),
  },
  taskEntry: {
    setFocused: registerAction(
      navigationActions.taskEntrySetFocused,
      (taskEntry: TaskEntry) => ({ taskEntry }),
      "editor/navigation",
    ),
    setLabel: registerAction(
      editorActions.editorTaskEntrySetLabel,
      (taskEntry: TaskEntry, label: string) => ({ taskEntry, label }),
      "editor/action",
    ),
    setTag: registerAction(
      editorActions.editorTaskEntrySetTag,
      (taskEntry: TaskEntry, tag: string | null) => ({ taskEntry, tag }),
      "editor/action",
    ),
    setValue: registerAction(
      editorActions.editorTaskEntrySetValue,
      (taskEntry: TaskEntry, newValue: string | null) => ({ taskEntry, newValue }),
      "editor/action",
    ),
    setValueType: registerAction(
      editorActions.editorTaskEntrySetValueType,
      (
        taskEntry: TaskEntry,
        valueType: TaskEntryValueType,
        rolloverBehavior?: TaskEntry["rolloverBehavior"],
      ) => ({ taskEntry, valueType, rolloverBehavior }),
      "editor/action",
    ),
  },
  taskItem: {
    addTaskEntry: registerAction(
      editorActions.addTaskEntryToTaskItem,
      (taskItem: TaskItem) => ({ taskItem }),
      "editor/action",
    ),
    addTaskItem: registerAction(
      editorActions.addTaskItemToTaskItem,
      (taskItem: TaskItem) => ({ taskItem }),
      "editor/action",
    ),
    deleteOnce: registerAction(
      editorActions.editorDeleteOnceTaskItem,
      (taskItem: TaskItem) => ({ taskItem }),
      "editor/action",
    ),
    setExpanded: registerAction(
      navigationActions.taskItemSetExpanded,
      (taskItem: TaskItem, isExpanded: boolean) => ({ taskItem, isExpanded }),
      "editor/navigation",
    ),
    setFocused: registerAction(
      navigationActions.taskItemSetFocused,
      (taskItem: TaskItem) => ({ taskItem }),
      "editor/navigation",
    ),
    setName: registerAction(
      editorActions.editorTaskItemSetName,
      (taskItem: TaskItem, name: string) => ({ taskItem, name }),
      "editor/action",
    ),
    setTag: registerAction(
      editorActions.editorTaskItemSetTag,
      (taskItem: TaskItem, tag: string | null) => ({ taskItem, tag }),
      "editor/action",
    ),
  },
  taskLog: {
    addTaskItem: registerAction(
      editorActions.addTaskItemToTaskLog,
      (taskLog: TaskLog) => ({ taskLog }),
      "editor/action",
    ),
    setFocused: registerAction(
      navigationActions.taskLogSetFocused,
      (taskLog: TaskLog) => ({ taskLog }),
      "editor/navigation",
    ),
    setTag: registerAction(
      editorActions.editorTaskLogSetTag,
      (taskLog: TaskLog, tag: string | null) => ({ taskLog, tag }),
      "editor/action",
    ),
  },
} as const;
