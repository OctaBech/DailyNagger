import { editorActions, editorSessionActions } from "@/services/actions";
import { registerAction } from "./actionRegistrationModel";

export const editorDialActionRegistry = {
  dial: {
    cancelEdit: registerAction(editorSessionActions.editorCancelEdit, "editor/session"),
    deleteSelectedNode: registerAction(editorActions.editorDeleteSelectedNode, "editor/action"),
    moveSelectedNodeDown: registerAction(editorActions.editorMoveSelectedNodeDown, "editor/action"),
    moveSelectedNodeUp: registerAction(editorActions.editorMoveSelectedNodeUp, "editor/action"),
    pinSelectedNagger: registerAction(editorActions.naggerPinSelected, "editor/action"),
    saveEdit: registerAction(editorSessionActions.editorSaveEdit, "editor/session"),
    unpinSelectedNagger: registerAction(editorActions.naggerUnpinSelected, "editor/action"),
  },
} as const;
