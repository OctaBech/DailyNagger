import {
  addTaskEntryToTaskItem as runAddTaskEntryToTaskItem,
  addTaskItemToTaskItem as runAddTaskItemToTaskItem,
  addTaskItemToTaskLog as runAddTaskItemToTaskLog,
  deleteOnceTaskItem as runDeleteOnceTaskItem,
  editorCancelEdit as runEditorCancelEdit,
  editorDeleteSelectedNode as runEditorDeleteSelectedNode,
  editorMoveSelectedNodeDown as runEditorMoveSelectedNodeDown,
  editorMoveSelectedNodeUp as runEditorMoveSelectedNodeUp,
  editorSaveEdit as runEditorSaveEdit,
  editorStartEdit as runEditorStartEdit,
  naggerPinSelected as runNaggerPinSelected,
  naggerSetExpanded as runNaggerSetExpanded,
  naggerSetFocused as runNaggerSetFocused,
  naggerSetScheduleRules as runNaggerSetScheduleRules,
  naggerSetTargetTime as runNaggerSetTargetTime,
  naggerSetTitle as runNaggerSetTitle,
  naggerUnpinSelected as runNaggerUnpinSelected,
  taskEntrySetFocused as runTaskEntrySetFocused,
  taskEntrySetLabel as runTaskEntrySetLabel,
  taskEntrySetTag as runTaskEntrySetTag,
  taskEntrySetValue as runTaskEntrySetValue,
  taskEntrySetValueType as runTaskEntrySetValueType,
  taskItemSetDoneAndSetFocus as runTaskItemSetDoneAndSetFocus,
  taskItemSetExpanded as runTaskItemSetExpanded,
  taskItemSetFocused as runTaskItemSetFocused,
  taskItemSetName as runTaskItemSetName,
  taskItemSetTag as runTaskItemSetTag,
  taskLogAddTaskStep as runTaskLogAddTaskStep,
  taskLogSetFocused as runTaskLogSetFocused,
  taskLogSetTag as runTaskLogSetTag,
} from "../actions";
import type {
  EditorDeleteSelectedNodeArgs,
  EditorMoveSelectedNodeArgs,
  EditorNaggerSessionArgs,
  EditorStartEditArgs,
  NaggerPinningArgs,
  NaggerSetExpandedArgs,
  NaggerSetFocusedArgs,
  NaggerSetScheduleRulesArgs,
  NaggerSetTargetTimeArgs,
  NaggerSetTitleArgs,
  TaskEntrySetFocusedArgs,
  TaskEntrySetLabelArgs,
  TaskEntrySetTagArgs,
  TaskEntrySetValueArgs,
  TaskEntrySetValueTypeArgs,
  TaskItemAddTaskEntryArgs,
  TaskItemAddTaskItemArgs,
  TaskItemDeleteOnceArgs,
  TaskItemSetDoneAndSetFocusArgs,
  TaskItemSetExpandedArgs,
  TaskItemSetFocusedArgs,
  TaskItemSetNameArgs,
  TaskItemSetTagArgs,
  TaskLogAddTaskItemArgs,
  TaskLogAddTaskStepArgs,
  TaskLogSetFocusedArgs,
  TaskLogSetTagArgs,
} from "./commandArgs";
import type {
  CommandEditorActionContext,
  CommandEditorSessionActionContext,
  CommandInputActionContext,
  CommandSyncActionContext,
  CommandViewActionContext,
} from "./commandScopes";

export function editorStartEdit(
  args: EditorStartEditArgs,
  context: CommandEditorSessionActionContext,
): void {
  runEditorStartEdit(context, args.naggerId);
}

export function editorSave(
  args: EditorNaggerSessionArgs,
  context: CommandEditorSessionActionContext,
): void {
  runEditorSaveEdit(context, args.nagger);
}

export function editorCancel(
  _args: EditorNaggerSessionArgs,
  context: CommandEditorSessionActionContext,
): void {
  runEditorCancelEdit(context);
}

export function editorMoveSelectedNodeUp(
  args: EditorMoveSelectedNodeArgs,
  context: CommandEditorActionContext,
): void {
  runEditorMoveSelectedNodeUp(context, args.moveContext);
}

export function editorMoveSelectedNodeDown(
  args: EditorMoveSelectedNodeArgs,
  context: CommandEditorActionContext,
): void {
  runEditorMoveSelectedNodeDown(context, args.moveContext);
}

export function editorDeleteSelectedNode(
  args: EditorDeleteSelectedNodeArgs,
  context: CommandEditorActionContext,
): void {
  runEditorDeleteSelectedNode(context, args.deleteContext);
}

export function naggerSetExpanded(
  args: NaggerSetExpandedArgs,
  context: CommandViewActionContext,
): void {
  runNaggerSetExpanded(context, args.nagger, args.isExpanded);
}

export function naggerSetFocused(
  args: NaggerSetFocusedArgs,
  context: CommandViewActionContext,
): void {
  runNaggerSetFocused(context, args.nagger);
}

export function naggerPinSelected(
  args: NaggerPinningArgs,
  context: CommandSyncActionContext,
): void {
  runNaggerPinSelected(context, args.nagger);
}

export function naggerUnpinSelected(
  args: NaggerPinningArgs,
  context: CommandSyncActionContext,
): void {
  runNaggerUnpinSelected(context, args.nagger);
}

export function naggerSetScheduleRules(
  args: NaggerSetScheduleRulesArgs,
  context: CommandInputActionContext,
): void {
  runNaggerSetScheduleRules(context, args.nagger, args.scheduleRules);
}

export function naggerSetTargetTime(
  args: NaggerSetTargetTimeArgs,
  context: CommandInputActionContext,
): void {
  runNaggerSetTargetTime(context, args.nagger, args.targetTime);
}

export function naggerSetTitle(args: NaggerSetTitleArgs, context: CommandInputActionContext): void {
  runNaggerSetTitle(context, args.nagger, args.title);
}

export function taskLogSetFocused(
  args: TaskLogSetFocusedArgs,
  context: CommandViewActionContext,
): void {
  runTaskLogSetFocused(context, args.taskLog);
}

export function taskLogSetTag(args: TaskLogSetTagArgs, context: CommandInputActionContext): void {
  runTaskLogSetTag(context, args.taskLog, args.tag);
}

export function taskLogAddTaskStep(
  args: TaskLogAddTaskStepArgs,
  context: CommandInputActionContext,
): void {
  runTaskLogAddTaskStep(context, args.taskLog, args.name, args.rolloverBehavior);
}

export function taskLogAddTaskItem(
  args: TaskLogAddTaskItemArgs,
  context: CommandEditorActionContext,
): void {
  runAddTaskItemToTaskLog(context, args.taskLog);
}

export function taskItemSetExpanded(
  args: TaskItemSetExpandedArgs,
  context: CommandViewActionContext,
): void {
  runTaskItemSetExpanded(context, args.taskItem, args.isExpanded);
}

export function taskItemSetFocused(
  args: TaskItemSetFocusedArgs,
  context: CommandViewActionContext,
): void {
  runTaskItemSetFocused(context, args.taskItem);
}

export function taskItemSetDoneAndSetFocus(
  args: TaskItemSetDoneAndSetFocusArgs,
  context: CommandInputActionContext,
): void {
  runTaskItemSetDoneAndSetFocus(context, args.taskItem, args.isDone);
}

export function taskItemDeleteOnce(
  args: TaskItemDeleteOnceArgs,
  context: CommandInputActionContext,
): void {
  runDeleteOnceTaskItem(context, args.taskItem);
}

export function taskItemAddTaskEntry(
  args: TaskItemAddTaskEntryArgs,
  context: CommandEditorActionContext,
): void {
  runAddTaskEntryToTaskItem(context, args.taskItem);
}

export function taskItemAddTaskItem(
  args: TaskItemAddTaskItemArgs,
  context: CommandEditorActionContext,
): void {
  runAddTaskItemToTaskItem(context, args.taskItem);
}

export function taskItemSetName(
  args: TaskItemSetNameArgs,
  context: CommandInputActionContext,
): void {
  runTaskItemSetName(context, args.taskItem, args.name);
}

export function taskItemSetTag(args: TaskItemSetTagArgs, context: CommandInputActionContext): void {
  runTaskItemSetTag(context, args.taskItem, args.tag);
}

export function taskEntrySetFocused(
  args: TaskEntrySetFocusedArgs,
  context: CommandViewActionContext,
): void {
  runTaskEntrySetFocused(context, args.taskEntry);
}

export function taskEntrySetValue(
  args: TaskEntrySetValueArgs,
  context: CommandInputActionContext,
): void {
  runTaskEntrySetValue(context, args.taskEntry, args.newValue);
}

export function taskEntrySetLabel(
  args: TaskEntrySetLabelArgs,
  context: CommandInputActionContext,
): void {
  runTaskEntrySetLabel(context, args.taskEntry, args.label);
}

export function taskEntrySetTag(
  args: TaskEntrySetTagArgs,
  context: CommandInputActionContext,
): void {
  runTaskEntrySetTag(context, args.taskEntry, args.tag);
}

export function taskEntrySetValueType(
  args: TaskEntrySetValueTypeArgs,
  context: CommandInputActionContext,
): void {
  runTaskEntrySetValueType(context, args.taskEntry, args.valueType, args.rolloverBehavior);
}
