import { command } from "../commandScopes";
import { editorActions } from "../../actions";

export const editorCommandActions = {
  "editor/nagger/set-schedule-rules": command(
    "editor",
    editorActions.editorNaggerSetScheduleRules,
  ),
  "editor/nagger/pin-selected": command("editor", editorActions.naggerPinSelected),
  "editor/nagger/unpin-selected": command("editor", editorActions.naggerUnpinSelected),
  "editor/nagger/set-target-time": command("editor", editorActions.editorNaggerSetTargetTime),
  "editor/nagger/set-title": command("editor", editorActions.editorNaggerSetTitle),
  "editor/delete-selected-node": command("editor", editorActions.editorDeleteSelectedNode),
  "editor/task-entry/set-label": command("editor", editorActions.editorTaskEntrySetLabel),
  "editor/task-entry/set-tag": command("editor", editorActions.editorTaskEntrySetTag),
  "editor/task-entry/set-value": command("editor", editorActions.editorTaskEntrySetValue),
  "editor/task-entry/set-value-type": command(
    "editor",
    editorActions.editorTaskEntrySetValueType,
  ),
  "editor/task-item/delete-once": command("editor", editorActions.editorDeleteOnceTaskItem),
  "editor/task-item/set-name": command("editor", editorActions.editorTaskItemSetName),
  "editor/task-item/set-tag": command("editor", editorActions.editorTaskItemSetTag),
  "editor/task-log/set-tag": command("editor", editorActions.editorTaskLogSetTag),
  "editor/move-selected-node-down": command("editor", editorActions.editorMoveSelectedNodeDown),
  "editor/move-selected-node-up": command("editor", editorActions.editorMoveSelectedNodeUp),
  "task-log/add-task-item": command("editor", editorActions.addTaskItemToTaskLog),
  "task-item/add-task-entry": command("editor", editorActions.addTaskEntryToTaskItem),
  "task-item/add-task-item": command("editor", editorActions.addTaskItemToTaskItem),
} as const;
