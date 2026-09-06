import type { TaskEntryValueType } from "@/api";
import type {
  Nagger,
  ScheduleRule,
  SelectedDeleteContext,
  SelectedMoveContext,
  TaskEntry,
  TaskItem,
  TaskLog,
} from "@/models";
import type { Guid } from "@/shared";

export type EditorStartEditArgs = {
  readonly naggerId: Guid | null;
};

export type EditorNaggerSessionArgs = {
  readonly nagger: Nagger;
};

export type EditorMoveSelectedNodeArgs = {
  readonly moveContext: SelectedMoveContext;
};

export type EditorDeleteSelectedNodeArgs = {
  readonly deleteContext: SelectedDeleteContext;
};

export type TaskEntrySetFocusedArgs = {
  readonly taskEntry: TaskEntry;
};

export type TaskEntrySetValueArgs = {
  readonly taskEntry: TaskEntry;
  readonly newValue: string | null;
};

export type NaggerSetFocusedArgs = {
  readonly nagger: Nagger;
};

export type NaggerSetExpandedArgs = {
  readonly nagger: Nagger;
  readonly isExpanded: boolean;
};

export type NaggerSetScheduleRulesArgs = {
  readonly nagger: Nagger;
  readonly scheduleRules: readonly ScheduleRule[];
};

export type NaggerSetTargetTimeArgs = {
  readonly nagger: Nagger;
  readonly targetTime: string | null;
};

export type NaggerSetTitleArgs = {
  readonly nagger: Nagger;
  readonly title: string;
};

export type NaggerPinningArgs = {
  readonly nagger: Nagger;
};

export type TaskLogSetFocusedArgs = {
  readonly taskLog: TaskLog;
};

export type TaskLogSetTagArgs = {
  readonly taskLog: TaskLog;
  readonly tag: string | null;
};

export type TaskLogAddTaskStepArgs = {
  readonly taskLog: TaskLog;
  readonly name: string;
  readonly rolloverBehavior: TaskItem["rolloverBehavior"];
};

export type TaskLogAddTaskItemArgs = {
  readonly taskLog: TaskLog;
};

export type TaskItemSetFocusedArgs = {
  readonly taskItem: TaskItem;
};

export type TaskItemSetExpandedArgs = {
  readonly taskItem: TaskItem;
  readonly isExpanded: boolean;
};

export type TaskItemSetDoneAndSetFocusArgs = {
  readonly taskItem: TaskItem;
  readonly isDone: boolean;
};

export type TaskItemDeleteOnceArgs = {
  readonly taskItem: TaskItem;
};

export type TaskItemAddTaskEntryArgs = {
  readonly taskItem: TaskItem;
};

export type TaskItemAddTaskItemArgs = {
  readonly taskItem: TaskItem;
};

export type TaskItemSetNameArgs = {
  readonly taskItem: TaskItem;
  readonly name: string;
};

export type TaskItemSetTagArgs = {
  readonly taskItem: TaskItem;
  readonly tag: string | null;
};

export type TaskEntrySetLabelArgs = {
  readonly taskEntry: TaskEntry;
  readonly label: string;
};

export type TaskEntrySetTagArgs = {
  readonly taskEntry: TaskEntry;
  readonly tag: string | null;
};

export type TaskEntrySetValueTypeArgs = {
  readonly taskEntry: TaskEntry;
  readonly valueType: TaskEntryValueType;
  readonly rolloverBehavior?: TaskEntry["rolloverBehavior"];
};
