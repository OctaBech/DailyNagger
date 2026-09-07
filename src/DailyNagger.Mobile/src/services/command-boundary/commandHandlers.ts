import {
  editorActions,
  editorSessionActions,
  navigationActions,
  taskInputActions,
} from "../actions";
import type {
  EditorDeleteSelectedNodeArgs,
  EditorMoveSelectedNodeArgs,
  EditorNaggerSessionArgs,
  EditorStartEditArgs,
  EditorTaskEntrySetValueArgs,
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
  CommandViewActionContext,
} from "./commandScopes";

export function editorStartEdit(
  args: EditorStartEditArgs,
  context: CommandEditorSessionActionContext,
): void {
  editorSessionActions.editorStartEdit(args, context);
}

export function editorSave(
  args: EditorNaggerSessionArgs,
  context: CommandEditorSessionActionContext,
): void {
  editorSessionActions.editorSaveEdit(args, context);
}

export function editorCancel(
  args: EditorNaggerSessionArgs,
  context: CommandEditorSessionActionContext,
): void {
  editorSessionActions.editorCancelEdit(args, context);
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
  navigationActions.naggerSetExpanded(args, context);
}

export function naggerSetFocused(
  args: NaggerSetFocusedArgs,
  context: CommandViewActionContext,
): void {
  navigationActions.naggerSetFocused(args, context);
}

export function naggerPinSelected(
  args: NaggerPinningArgs,
  context: CommandInputActionContext,
): void {
  taskInputActions.naggerPinSelected(args, context);
}

export function naggerUnpinSelected(
  args: NaggerPinningArgs,
  context: CommandInputActionContext,
): void {
  taskInputActions.naggerUnpinSelected(args, context);
}

export function editorNaggerPinSelected(
  args: NaggerPinningArgs,
  context: CommandEditorActionContext,
): void {
  editorActions.naggerPinSelected(args, context);
}

export function editorNaggerUnpinSelected(
  args: NaggerPinningArgs,
  context: CommandEditorActionContext,
): void {
  editorActions.naggerUnpinSelected(args, context);
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
  navigationActions.taskLogSetFocused(args, context);
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
  navigationActions.taskItemSetExpanded(args, context);
}

export function taskItemSetFocused(
  args: TaskItemSetFocusedArgs,
  context: CommandViewActionContext,
): void {
  navigationActions.taskItemSetFocused(args, context);
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
  navigationActions.taskEntrySetFocused(args, context);
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
  args: EditorTaskEntrySetValueArgs,
  context: CommandEditorActionContext,
): void {
  editorActions.editorTaskEntrySetValue(context, args.taskEntry, args.newValue);
}
