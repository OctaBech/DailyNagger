import type {
  Nagger,
  ScheduleRule,
  TaskEntry,
  TaskItem,
  TaskLog,
} from "@/models";
import type { TaskEntryValueType } from "@/api";
import type { Guid } from "@/shared";
import type { Memory } from "@/services/contracts";
import { selectedPathOperations } from "@/services/core-tree-operations";
import { viewOperations } from "@/services/operations";
import type { Sending } from "../sending";
import {
  editorDeleteSelectedNode as runEditorDeleteSelectedNode,
  editorMoveSelectedNodeDown as runEditorMoveSelectedNodeDown,
  editorMoveSelectedNodeUp as runEditorMoveSelectedNodeUp,
  editorSaveEdit as runEditorSaveEdit,
  editorStartEdit as runEditorStartEdit,
  editorTaskEntryAdd as runEditorTaskEntryAdd,
  editorTaskItemAdd as runEditorTaskItemAdd,
  addTaskEntryToTaskItem as runAddTaskEntryToTaskItem,
  addTaskItemToTaskItem as runAddTaskItemToTaskItem,
  addTaskItemToTaskLog as runAddTaskItemToTaskLog,
  deleteOnceTaskItem as runDeleteOnceTaskItem,
  type EditorSessionActionScope,
  naggerSetScheduleRules as runNaggerSetScheduleRules,
  naggerSetTargetTime as runNaggerSetTargetTime,
  naggerSetTitle as runNaggerSetTitle,
  naggerPinSelected as runNaggerPinSelected,
  naggerUnpinSelected as runNaggerUnpinSelected,
  taskEntrySetLabel as runTaskEntrySetLabel,
  taskEntrySetTag as runTaskEntrySetTag,
  taskEntrySetValue as runTaskEntrySetValue,
  taskEntrySetValueType as runTaskEntrySetValueType,
  taskItemAddQuickNote as runTaskItemAddQuickNote,
  taskItemSetDoneAndSetFocus as runTaskItemSetDoneAndSetFocus,
  taskItemSetName as runTaskItemSetName,
  taskItemSetTag as runTaskItemSetTag,
  taskLogAddTaskStep as runTaskLogAddTaskStep,
  taskLogSetTag as runTaskLogSetTag,
  type InputActionScope,
} from "../actions";

export type CommandViewActionContext = {
  readonly memory: Memory;
};

export type CommandSyncActionContext = {
  readonly memory: Memory;
  readonly sending: Sending;
};

export type CommandEditorActionContext = {
  readonly memory: Memory;
};

export type CommandInputActionContext = InputActionScope;

export type CommandEditorSessionActionContext = EditorSessionActionScope;

export type CommandActionContext =
  | CommandEditorActionContext
  | CommandEditorSessionActionContext
  | CommandInputActionContext
  | CommandSyncActionContext
  | CommandViewActionContext;

export type CommandScope = "editor-action" | "editor-session" | "input" | "sync" | "view";

export type SourceForScope<TScope extends CommandScope> = TScope extends "view"
  ? "editor-view" | "plan-view"
  : TScope extends "input"
    ? "editor-input" | "plan-input"
    : TScope extends "sync"
      ? "editor-sync" | "plan-sync"
      : TScope extends "editor-action"
        ? "editor-action"
        : TScope extends "editor-session"
          ? "editor-session"
          : never;

export type ContextForScope<TScope extends CommandScope> = TScope extends "view"
  ? CommandViewActionContext
  : TScope extends "input"
    ? CommandInputActionContext
    : TScope extends "sync"
      ? CommandSyncActionContext
      : TScope extends "editor-action"
        ? CommandEditorActionContext
        : TScope extends "editor-session"
          ? CommandEditorSessionActionContext
          : never;

export type CommandDefinition<TScope extends CommandScope, TArgs> = {
  readonly scope: TScope;
  readonly run: (args: TArgs, context: ContextForScope<TScope>) => void;
};

function command<TScope extends CommandScope, TArgs>(
  scope: TScope,
  run: (args: TArgs, context: ContextForScope<TScope>) => void,
): CommandDefinition<TScope, TArgs> {
  return { scope, run };
}

type EmptyCommandArgs = Record<string, never>;

type EditorStartEditArgs = {
  readonly naggerId: Guid | null;
};

type TaskEntrySetFocusedArgs = {
  readonly taskEntry: TaskEntry;
};

type TaskEntrySetValueArgs = {
  readonly taskEntry: TaskEntry;
  readonly newValue: string | null;
};

type NaggerSetFocusedArgs = {
  readonly nagger: Nagger;
};

type NaggerSetExpandedArgs = {
  readonly nagger: Nagger;
  readonly isExpanded: boolean;
};

type NaggerSetScheduleRulesArgs = {
  readonly nagger: Nagger;
  readonly scheduleRules: readonly ScheduleRule[];
};

type NaggerSetTargetTimeArgs = {
  readonly nagger: Nagger;
  readonly targetTime: string | null;
};

type NaggerSetTitleArgs = {
  readonly nagger: Nagger;
  readonly title: string;
};

type TaskLogSetFocusedArgs = {
  readonly taskLog: TaskLog;
};

type TaskLogSetTagArgs = {
  readonly taskLog: TaskLog;
  readonly tag: string | null;
};

type TaskLogAddTaskStepArgs = {
  readonly taskLog: TaskLog;
  readonly name: string;
  readonly rolloverBehavior: TaskItem["rolloverBehavior"];
};

type TaskLogAddTaskItemArgs = {
  readonly taskLog: TaskLog;
};

type TaskItemSetFocusedArgs = {
  readonly taskItem: TaskItem;
};

type TaskItemSetExpandedArgs = {
  readonly taskItem: TaskItem;
  readonly isExpanded: boolean;
};

type TaskItemSetDoneAndSetFocusArgs = {
  readonly taskItem: TaskItem;
  readonly isDone: boolean;
};

type TaskItemAddQuickNoteArgs = {
  readonly taskItem: TaskItem;
};

type TaskItemDeleteOnceArgs = {
  readonly taskItem: TaskItem;
};

type TaskItemAddTaskEntryArgs = {
  readonly taskItem: TaskItem;
};

type TaskItemAddTaskItemArgs = {
  readonly taskItem: TaskItem;
};

type TaskItemSetNameArgs = {
  readonly taskItem: TaskItem;
  readonly name: string;
};

type TaskItemSetTagArgs = {
  readonly taskItem: TaskItem;
  readonly tag: string | null;
};

type TaskEntrySetLabelArgs = {
  readonly taskEntry: TaskEntry;
  readonly label: string;
};

type TaskEntrySetTagArgs = {
  readonly taskEntry: TaskEntry;
  readonly tag: string | null;
};

type TaskEntrySetValueTypeArgs = {
  readonly taskEntry: TaskEntry;
  readonly valueType: TaskEntryValueType;
  readonly rolloverBehavior?: TaskEntry["rolloverBehavior"];
};

function editorStartEdit(
  args: EditorStartEditArgs,
  context: CommandEditorSessionActionContext,
): void {
  runEditorStartEdit(context, args.naggerId);
}

function editorSave(_args: EmptyCommandArgs, context: CommandEditorSessionActionContext): void {
  runEditorSaveEdit(context);
}

function editorTaskEntryAdd(_args: EmptyCommandArgs, context: CommandEditorActionContext): void {
  runEditorTaskEntryAdd(context);
}

function editorTaskItemAdd(_args: EmptyCommandArgs, context: CommandEditorActionContext): void {
  runEditorTaskItemAdd(context);
}

function editorMoveSelectedNodeUp(
  _args: EmptyCommandArgs,
  context: CommandEditorActionContext,
): void {
  runEditorMoveSelectedNodeUp(context);
}

function editorMoveSelectedNodeDown(
  _args: EmptyCommandArgs,
  context: CommandEditorActionContext,
): void {
  runEditorMoveSelectedNodeDown(context);
}

function editorDeleteSelectedNode(
  _args: EmptyCommandArgs,
  context: CommandEditorActionContext,
): void {
  runEditorDeleteSelectedNode(context);
}

function naggerSetExpanded(
  args: NaggerSetExpandedArgs,
  context: CommandViewActionContext,
): void {
  const tree = context.memory.read.getTree();
  const result = viewOperations.replaceNaggerViewProps(tree, args.nagger, {
    isExpanded: args.isExpanded,
  });

  context.memory.write.setTreeAndSelectedPath(result.tree, result.treePath);
}

function naggerSetFocused(
  args: NaggerSetFocusedArgs,
  context: CommandViewActionContext,
): void {
  const tree = context.memory.read.getTree();
  const treePath = selectedPathOperations.refreshPathToNode(tree, args.nagger);

  context.memory.write.setTreeAndSelectedPath(tree, treePath);
}

function naggerPinSelected(
  _args: EmptyCommandArgs,
  context: CommandSyncActionContext,
): void {
  runNaggerPinSelected(context);
}

function naggerUnpinSelected(
  _args: EmptyCommandArgs,
  context: CommandSyncActionContext,
): void {
  runNaggerUnpinSelected(context);
}

function naggerSetScheduleRules(
  args: NaggerSetScheduleRulesArgs,
  context: CommandInputActionContext,
): void {
  runNaggerSetScheduleRules(context, args.nagger, args.scheduleRules);
}

function naggerSetTargetTime(
  args: NaggerSetTargetTimeArgs,
  context: CommandInputActionContext,
): void {
  runNaggerSetTargetTime(context, args.nagger, args.targetTime);
}

function naggerSetTitle(
  args: NaggerSetTitleArgs,
  context: CommandInputActionContext,
): void {
  runNaggerSetTitle(context, args.nagger, args.title);
}

function taskLogSetFocused(
  args: TaskLogSetFocusedArgs,
  context: CommandViewActionContext,
): void {
  const tree = context.memory.read.getTree();
  const treePath = selectedPathOperations.refreshPathToNode(tree, args.taskLog);

  context.memory.write.setTreeAndSelectedPath(tree, treePath);
}

function taskLogSetTag(
  args: TaskLogSetTagArgs,
  context: CommandInputActionContext,
): void {
  runTaskLogSetTag(context, args.taskLog, args.tag);
}

function taskLogAddTaskStep(
  args: TaskLogAddTaskStepArgs,
  context: CommandInputActionContext,
): void {
  runTaskLogAddTaskStep(context, args.taskLog, args.name, args.rolloverBehavior);
}

function taskLogAddTaskItem(
  args: TaskLogAddTaskItemArgs,
  context: CommandEditorActionContext,
): void {
  runAddTaskItemToTaskLog(context, args.taskLog);
}

function taskItemSetExpanded(
  args: TaskItemSetExpandedArgs,
  context: CommandViewActionContext,
): void {
  const tree = context.memory.read.getTree();
  const result = viewOperations.replaceTaskItemViewProps(tree, args.taskItem, {
    isExpanded: args.isExpanded,
  });

  context.memory.write.setTreeAndSelectedPath(result.tree, result.treePath);
}

function taskItemSetFocused(
  args: TaskItemSetFocusedArgs,
  context: CommandViewActionContext,
): void {
  const tree = context.memory.read.getTree();
  const treePath = selectedPathOperations.refreshPathToNode(tree, args.taskItem);

  context.memory.write.setTreeAndSelectedPath(tree, treePath);
}

function taskItemSetDoneAndSetFocus(
  args: TaskItemSetDoneAndSetFocusArgs,
  context: CommandInputActionContext,
): void {
  runTaskItemSetDoneAndSetFocus(context, args.taskItem, args.isDone);
}

function taskItemAddQuickNote(
  args: TaskItemAddQuickNoteArgs,
  context: CommandInputActionContext,
): void {
  runTaskItemAddQuickNote(context, args.taskItem);
}

function taskItemDeleteOnce(
  args: TaskItemDeleteOnceArgs,
  context: CommandInputActionContext,
): void {
  runDeleteOnceTaskItem(context, args.taskItem);
}

function taskItemAddTaskEntry(
  args: TaskItemAddTaskEntryArgs,
  context: CommandEditorActionContext,
): void {
  runAddTaskEntryToTaskItem(context, args.taskItem);
}

function taskItemAddTaskItem(
  args: TaskItemAddTaskItemArgs,
  context: CommandEditorActionContext,
): void {
  runAddTaskItemToTaskItem(context, args.taskItem);
}

function taskItemSetName(
  args: TaskItemSetNameArgs,
  context: CommandInputActionContext,
): void {
  runTaskItemSetName(context, args.taskItem, args.name);
}

function taskItemSetTag(
  args: TaskItemSetTagArgs,
  context: CommandInputActionContext,
): void {
  runTaskItemSetTag(context, args.taskItem, args.tag);
}

function taskEntrySetFocused(
  args: TaskEntrySetFocusedArgs,
  context: CommandViewActionContext,
): void {
  const tree = context.memory.read.getTree();
  const treePath = selectedPathOperations.refreshPathToNode(tree, args.taskEntry);

  context.memory.write.setTreeAndSelectedPath(tree, treePath);
}

function taskEntrySetValue(
  args: TaskEntrySetValueArgs,
  context: CommandInputActionContext,
): void {
  runTaskEntrySetValue(context, args.taskEntry, args.newValue);
}

function taskEntrySetLabel(
  args: TaskEntrySetLabelArgs,
  context: CommandInputActionContext,
): void {
  runTaskEntrySetLabel(context, args.taskEntry, args.label);
}

function taskEntrySetTag(
  args: TaskEntrySetTagArgs,
  context: CommandInputActionContext,
): void {
  runTaskEntrySetTag(context, args.taskEntry, args.tag);
}

function taskEntrySetValueType(
  args: TaskEntrySetValueTypeArgs,
  context: CommandInputActionContext,
): void {
  runTaskEntrySetValueType(context, args.taskEntry, args.valueType, args.rolloverBehavior);
}

export const commandActions = {
  "editor/delete-selected-node": command("editor-action", editorDeleteSelectedNode),
  "editor/move-selected-node-down": command("editor-action", editorMoveSelectedNodeDown),
  "editor/move-selected-node-up": command("editor-action", editorMoveSelectedNodeUp),
  "editor/save": command("editor-session", editorSave),
  "editor/start-edit": command("editor-session", editorStartEdit),
  "editor/task-entry-add": command("editor-action", editorTaskEntryAdd),
  "editor/task-item-add": command("editor-action", editorTaskItemAdd),
  "nagger/set-expanded": command("view", naggerSetExpanded),
  "nagger/set-focused": command("view", naggerSetFocused),
  "nagger/pin-selected": command("sync", naggerPinSelected),
  "nagger/set-schedule-rules": command("input", naggerSetScheduleRules),
  "nagger/set-target-time": command("input", naggerSetTargetTime),
  "nagger/set-title": command("input", naggerSetTitle),
  "nagger/unpin-selected": command("sync", naggerUnpinSelected),
  "task-log/set-focused": command("view", taskLogSetFocused),
  "task-log/set-tag": command("input", taskLogSetTag),
  "task-log/add-task-step": command("input", taskLogAddTaskStep),
  "task-log/add-task-item": command("editor-action", taskLogAddTaskItem),
  "task-item/set-expanded": command("view", taskItemSetExpanded),
  "task-item/set-focused": command("view", taskItemSetFocused),
  "task-item/set-done-and-set-focus": command("input", taskItemSetDoneAndSetFocus),
  "task-item/add-quick-note": command("input", taskItemAddQuickNote),
  "task-item/delete-once": command("input", taskItemDeleteOnce),
  "task-item/add-task-entry": command("editor-action", taskItemAddTaskEntry),
  "task-item/add-task-item": command("editor-action", taskItemAddTaskItem),
  "task-item/set-name": command("input", taskItemSetName),
  "task-item/set-tag": command("input", taskItemSetTag),
  "task-entry/set-focused": command("view", taskEntrySetFocused),
  "task-entry/set-label": command("input", taskEntrySetLabel),
  "task-entry/set-tag": command("input", taskEntrySetTag),
  "task-entry/set-value": command("input", taskEntrySetValue),
  "task-entry/set-value-type": command("input", taskEntrySetValueType),
} as const;
