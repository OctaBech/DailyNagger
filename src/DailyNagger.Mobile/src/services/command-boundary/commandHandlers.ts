import {
  editorCancelEdit as runEditorCancelEdit,
  editorSaveEdit as runEditorSaveEdit,
  editorStartEdit as runEditorStartEdit,
  editorActions,
  naggerPinSelected as runNaggerPinSelected,
  naggerSetExpanded as runNaggerSetExpanded,
  naggerSetFocused as runNaggerSetFocused,
  naggerUnpinSelected as runNaggerUnpinSelected,
  taskInputActions,
  taskEntrySetFocused as runTaskEntrySetFocused,
  taskItemSetExpanded as runTaskItemSetExpanded,
  taskItemSetFocused as runTaskItemSetFocused,
  taskLogSetFocused as runTaskLogSetFocused,
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
  editorActions.editorMoveSelectedNodeUp(context, args.moveContext);
}

export function editorMoveSelectedNodeDown(
  args: EditorMoveSelectedNodeArgs,
  context: CommandEditorActionContext,
): void {
  editorActions.editorMoveSelectedNodeDown(context, args.moveContext);
}

export function editorDeleteSelectedNode(
  args: EditorDeleteSelectedNodeArgs,
  context: CommandEditorActionContext,
): void {
  editorActions.editorDeleteSelectedNode(context, args.deleteContext);
}

export function editorDeleteOnceTaskItem(
  args: TaskItemDeleteOnceArgs,
  context: CommandEditorActionContext,
): void {
  editorActions.editorDeleteOnceTaskItem(context, args.taskItem);
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

export function editorNaggerSetScheduleRules(
  args: NaggerSetScheduleRulesArgs,
  context: CommandEditorActionContext,
): void {
  editorActions.editorNaggerSetScheduleRules(context, args.nagger, args.scheduleRules);
}

export function editorNaggerSetTargetTime(
  args: NaggerSetTargetTimeArgs,
  context: CommandEditorActionContext,
): void {
  editorActions.editorNaggerSetTargetTime(context, args.nagger, args.targetTime);
}

export function editorNaggerSetTitle(
  args: NaggerSetTitleArgs,
  context: CommandEditorActionContext,
): void {
  editorActions.editorNaggerSetTitle(context, args.nagger, args.title);
}

export function taskLogSetFocused(
  args: TaskLogSetFocusedArgs,
  context: CommandViewActionContext,
): void {
  runTaskLogSetFocused(context, args.taskLog);
}

export function editorTaskLogSetTag(
  args: TaskLogSetTagArgs,
  context: CommandEditorActionContext,
): void {
  editorActions.editorTaskLogSetTag(context, args.taskLog, args.tag);
}

export function taskLogAddTaskStep(
  args: TaskLogAddTaskStepArgs,
  context: CommandInputActionContext,
): void {
  taskInputActions.taskLogAddTaskStep(context, args.taskLog, args.name, args.rolloverBehavior);
}

export function taskLogAddTaskItem(
  args: TaskLogAddTaskItemArgs,
  context: CommandEditorActionContext,
): void {
  editorActions.addTaskItemToTaskLog(context, args.taskLog);
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
  taskInputActions.taskItemSetDoneAndSetFocus(context, args.taskItem, args.isDone);
}

export function taskItemDeleteOnce(
  args: TaskItemDeleteOnceArgs,
  context: CommandInputActionContext,
): void {
  taskInputActions.deleteOnceTaskItem(context, args.taskItem);
}

export function taskItemAddTaskEntry(
  args: TaskItemAddTaskEntryArgs,
  context: CommandEditorActionContext,
): void {
  editorActions.addTaskEntryToTaskItem(context, args.taskItem);
}

export function taskItemAddTaskItem(
  args: TaskItemAddTaskItemArgs,
  context: CommandEditorActionContext,
): void {
  editorActions.addTaskItemToTaskItem(context, args.taskItem);
}

export function editorTaskItemSetName(
  args: TaskItemSetNameArgs,
  context: CommandEditorActionContext,
): void {
  editorActions.editorTaskItemSetName(context, args.taskItem, args.name);
}

export function editorTaskItemSetTag(
  args: TaskItemSetTagArgs,
  context: CommandEditorActionContext,
): void {
  editorActions.editorTaskItemSetTag(context, args.taskItem, args.tag);
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
  taskInputActions.taskEntrySetValue(context, args.taskEntry, args.newValue);
}

export function editorTaskEntrySetLabel(
  args: TaskEntrySetLabelArgs,
  context: CommandEditorActionContext,
): void {
  editorActions.editorTaskEntrySetLabel(context, args.taskEntry, args.label);
}

export function editorTaskEntrySetTag(
  args: TaskEntrySetTagArgs,
  context: CommandEditorActionContext,
): void {
  editorActions.editorTaskEntrySetTag(context, args.taskEntry, args.tag);
}

export function editorTaskEntrySetValueType(
  args: TaskEntrySetValueTypeArgs,
  context: CommandEditorActionContext,
): void {
  editorActions.editorTaskEntrySetValueType(
    context,
    args.taskEntry,
    args.valueType,
    args.rolloverBehavior,
  );
}

export function editorTaskEntrySetValue(
  args: TaskEntrySetValueArgs,
  context: CommandEditorActionContext,
): void {
  editorActions.editorTaskEntrySetValue(context, args.taskEntry, args.newValue);
}
