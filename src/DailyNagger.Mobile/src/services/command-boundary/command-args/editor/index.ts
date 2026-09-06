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

export type EditorMoveSelectedNodeArgs = {
  readonly moveContext: SelectedMoveContext;
};

export type EditorDeleteSelectedNodeArgs = {
  readonly deleteContext: SelectedDeleteContext;
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

export type TaskLogSetTagArgs = {
  readonly taskLog: TaskLog;
  readonly tag: string | null;
};

export type TaskLogAddTaskItemArgs = {
  readonly taskLog: TaskLog;
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

export type EditorTaskEntrySetValueArgs = {
  readonly taskEntry: TaskEntry;
  readonly newValue: string | null;
};
