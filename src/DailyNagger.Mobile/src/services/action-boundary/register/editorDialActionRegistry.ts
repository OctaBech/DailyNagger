import { editorActions, editorSessionActions } from "@/services/actions";
import { registerAction } from "./actionRegistrationModel";

export const editorDialActionRegistry = {
  dial: {
    copySelectedNode: registerAction(editorActions.editorCopySelectedNode, "editor/action"),
    pasteNodeIntoTaskItem: registerAction(editorActions.pasteNodeIntoTaskItem, "editor/action"),
    pasteNodeIntoTaskLog: registerAction(editorActions.pasteNodeIntoTaskLog, "editor/action"),
    undoEdit: registerAction(editorActions.editorUndoEdit, "editor/action"),
    redoEdit: registerAction(editorActions.editorRedoEdit, "editor/action"),
    cancelEdit: registerAction(editorSessionActions.editorCancelEdit, "editor/session"),
    deleteSelectedNode: registerAction(editorActions.editorDeleteSelectedNode, "editor/action"),
    moveSelectedNodeDown: registerAction(editorActions.editorMoveSelectedNodeDown, "editor/action"),
    moveSelectedNodeUp: registerAction(editorActions.editorMoveSelectedNodeUp, "editor/action"),
    pinSelectedNagger: registerAction(editorActions.naggerPinSelected, "editor/action"),
    saveEdit: registerAction(editorSessionActions.editorSaveEdit, "editor/session"),
    unpinSelectedNagger: registerAction(editorActions.naggerUnpinSelected, "editor/action"),
  },
} as const;
