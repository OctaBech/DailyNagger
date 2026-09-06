import type { Nagger, TaskEntry, TaskItem, TaskLog } from "@/models";

export type TaskEntrySetFocusedArgs = {
  readonly taskEntry: TaskEntry;
};

export type NaggerSetFocusedArgs = {
  readonly nagger: Nagger;
};

export type NaggerSetExpandedArgs = {
  readonly nagger: Nagger;
  readonly isExpanded: boolean;
};

export type TaskLogSetFocusedArgs = {
  readonly taskLog: TaskLog;
};

export type TaskItemSetFocusedArgs = {
  readonly taskItem: TaskItem;
};

export type TaskItemSetExpandedArgs = {
  readonly taskItem: TaskItem;
  readonly isExpanded: boolean;
};
