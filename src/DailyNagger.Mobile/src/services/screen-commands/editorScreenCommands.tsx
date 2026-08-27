import type { TaskEntryValueType } from "@/api";
import type { Nagger, ScheduleRule, TaskEntry, TaskItem, TaskLog } from "@/models";
import { createRequiredContext, type Guid, type Prettify } from "@/shared";
import type { SelectedDeleteContext, SelectedMoveContext } from "@/services/core-node-operations";
import type { CommandDispatcher } from "@/services/command-boundary";
import { useMemo } from "react";

export type EditorScreenCommands = Prettify<ReturnType<typeof useCreateEditorScreenCommands>>;

export const {
  Provider: EditorScreenCommandsProvider,
  useRequiredContext: useEditorScreenCommands,
} = createRequiredContext<EditorScreenCommands>("EditorScreenCommandsContext");

type UseCreateEditorScreenCommandsProps = {
  readonly dispatch: CommandDispatcher;
};

export function useCreateEditorScreenCommands({ dispatch }: UseCreateEditorScreenCommandsProps) {
  return useMemo(
    () => ({
      effects: {
        startEdit: (naggerId: Guid | null) => {
          dispatch("editor-session", "editor/start-edit", { naggerId });
        },
      },
      dial: {
        cancelEdit: (nagger: Nagger) => {
          dispatch("editor-session", "editor/cancel", { nagger });
        },
        deleteSelectedNode: (deleteContext: SelectedDeleteContext) => {
          dispatch("editor-action", "editor/delete-selected-node", { deleteContext });
        },
        moveSelectedNodeDown: (moveContext: SelectedMoveContext) => {
          dispatch("editor-action", "editor/move-selected-node-down", { moveContext });
        },
        moveSelectedNodeUp: (moveContext: SelectedMoveContext) => {
          dispatch("editor-action", "editor/move-selected-node-up", { moveContext });
        },
        pinSelectedNagger: (nagger: Nagger) => {
          dispatch("editor-sync", "nagger/pin-selected", { nagger });
        },
        saveEdit: (nagger: Nagger) => {
          dispatch("editor-session", "editor/save", { nagger });
        },
        taskEntryAdd: (taskLog: TaskLog, taskItem: TaskItem) => {
          dispatch("editor-action", "editor/task-entry-add", { taskLog, taskItem });
        },
        taskItemAdd: (taskLog: TaskLog, taskItem: TaskItem | null) => {
          dispatch("editor-action", "editor/task-item-add", { taskLog, taskItem });
        },
        unpinSelectedNagger: (nagger: Nagger) => {
          dispatch("editor-sync", "nagger/unpin-selected", { nagger });
        },
      },
      nagger: {
        setExpanded: (nagger: Nagger, isExpanded: boolean) => {
          dispatch("editor-view", "nagger/set-expanded", { nagger, isExpanded });
        },
        setFocused: (nagger: Nagger) => {
          dispatch("editor-view", "nagger/set-focused", { nagger });
        },
        setScheduleRules: (nagger: Nagger, scheduleRules: readonly ScheduleRule[]) => {
          dispatch("editor-input", "nagger/set-schedule-rules", { nagger, scheduleRules });
        },
        setTargetTime: (nagger: Nagger, targetTime: string | null) => {
          dispatch("editor-input", "nagger/set-target-time", { nagger, targetTime });
        },
        setTitle: (nagger: Nagger, title: string) => {
          dispatch("editor-input", "nagger/set-title", { nagger, title });
        },
      },
      taskLog: {
        addTaskItem: (taskLog: TaskLog) => {
          dispatch("editor-action", "task-log/add-task-item", { taskLog });
        },
        setFocused: (taskLog: TaskLog) => {
          dispatch("editor-view", "task-log/set-focused", { taskLog });
        },
        setTag: (taskLog: TaskLog, tag: string | null) => {
          dispatch("editor-input", "task-log/set-tag", { taskLog, tag });
        },
      },
      taskItem: {
        addTaskEntry: (taskItem: TaskItem) => {
          dispatch("editor-action", "task-item/add-task-entry", { taskItem });
        },
        addTaskItem: (taskItem: TaskItem) => {
          dispatch("editor-action", "task-item/add-task-item", { taskItem });
        },
        deleteOnce: (taskItem: TaskItem) => {
          dispatch("editor-input", "task-item/delete-once", { taskItem });
        },
        setExpanded: (taskItem: TaskItem, isExpanded: boolean) => {
          dispatch("editor-view", "task-item/set-expanded", { taskItem, isExpanded });
        },
        setFocused: (taskItem: TaskItem) => {
          dispatch("editor-view", "task-item/set-focused", { taskItem });
        },
        setName: (taskItem: TaskItem, name: string) => {
          dispatch("editor-input", "task-item/set-name", { taskItem, name });
        },
        setTag: (taskItem: TaskItem, tag: string | null) => {
          dispatch("editor-input", "task-item/set-tag", { taskItem, tag });
        },
      },
      taskEntry: {
        setFocused: (taskEntry: TaskEntry) => {
          dispatch("editor-view", "task-entry/set-focused", { taskEntry });
        },
        setLabel: (taskEntry: TaskEntry, label: string) => {
          dispatch("editor-input", "task-entry/set-label", { taskEntry, label });
        },
        setTag: (taskEntry: TaskEntry, tag: string | null) => {
          dispatch("editor-input", "task-entry/set-tag", { taskEntry, tag });
        },
        setValue: (taskEntry: TaskEntry, newValue: string | null) => {
          dispatch("editor-input", "task-entry/set-value", { taskEntry, newValue });
        },
        setValueType: (
          taskEntry: TaskEntry,
          valueType: TaskEntryValueType,
          rolloverBehavior?: TaskEntry["rolloverBehavior"],
        ) => {
          dispatch("editor-input", "task-entry/set-value-type", {
            taskEntry,
            valueType,
            rolloverBehavior,
          });
        },
      },
    }),
    [dispatch],
  );
}
