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
  editorActions.editorMoveSelectedNodeUp(args, context);
}

export function editorMoveSelectedNodeDown(
  args: EditorMoveSelectedNodeArgs,
  context: CommandEditorActionContext,
): void {
  editorActions.editorMoveSelectedNodeDown(args, context);
}

export function editorDeleteSelectedNode(
  args: EditorDeleteSelectedNodeArgs,
  context: CommandEditorActionContext,
): void {
  editorActions.editorDeleteSelectedNode(args, context);
}

export function editorDeleteOnceTaskItem(
  args: TaskItemDeleteOnceArgs,
  context: CommandEditorActionContext,
): void {
  editorActions.editorDeleteOnceTaskItem(args, context);
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
  editorActions.editorNaggerSetScheduleRules(args, context);
}

export function editorNaggerSetTargetTime(
  args: NaggerSetTargetTimeArgs,
  context: CommandEditorActionContext,
): void {
  editorActions.editorNaggerSetTargetTime(args, context);
}

export function editorNaggerSetTitle(
  args: NaggerSetTitleArgs,
  context: CommandEditorActionContext,
): void {
  editorActions.editorNaggerSetTitle(args, context);
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
  editorActions.editorTaskLogSetTag(args, context);
}

export function taskLogAddTaskStep(
  args: TaskLogAddTaskStepArgs,
  context: CommandInputActionContext,
): void {
  taskInputActions.taskLogAddTaskStep(args, context);
}

export function taskLogAddTaskItem(
  args: TaskLogAddTaskItemArgs,
  context: CommandEditorActionContext,
): void {
  editorActions.addTaskItemToTaskLog(args, context);
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
  taskInputActions.taskItemSetDoneAndSetFocus(args, context);
}

export function taskItemDeleteOnce(
  args: TaskItemDeleteOnceArgs,
  context: CommandInputActionContext,
): void {
  taskInputActions.deleteOnceTaskItem(args, context);
}

export function taskItemAddTaskEntry(
  args: TaskItemAddTaskEntryArgs,
  context: CommandEditorActionContext,
): void {
  editorActions.addTaskEntryToTaskItem(args, context);
}

export function taskItemAddTaskItem(
  args: TaskItemAddTaskItemArgs,
  context: CommandEditorActionContext,
): void {
  editorActions.addTaskItemToTaskItem(args, context);
}

export function editorTaskItemSetName(
  args: TaskItemSetNameArgs,
  context: CommandEditorActionContext,
): void {
  editorActions.editorTaskItemSetName(args, context);
}

export function editorTaskItemSetTag(
  args: TaskItemSetTagArgs,
  context: CommandEditorActionContext,
): void {
  editorActions.editorTaskItemSetTag(args, context);
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
  taskInputActions.taskEntrySetValue(args, context);
}

export function editorTaskEntrySetLabel(
  args: TaskEntrySetLabelArgs,
  context: CommandEditorActionContext,
): void {
  editorActions.editorTaskEntrySetLabel(args, context);
}

export function editorTaskEntrySetTag(
  args: TaskEntrySetTagArgs,
  context: CommandEditorActionContext,
): void {
  editorActions.editorTaskEntrySetTag(args, context);
}

export function editorTaskEntrySetValueType(
  args: TaskEntrySetValueTypeArgs,
  context: CommandEditorActionContext,
): void {
  editorActions.editorTaskEntrySetValueType(args, context);
}

export function editorTaskEntrySetValue(
  args: EditorTaskEntrySetValueArgs,
  context: CommandEditorActionContext,
): void {
  editorActions.editorTaskEntrySetValue(args, context);
}
