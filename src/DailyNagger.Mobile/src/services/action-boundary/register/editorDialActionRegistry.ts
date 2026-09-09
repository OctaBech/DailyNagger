import type { Nagger, SelectedDeleteContext, SelectedMoveContext } from "@/models";
import { editorActions, editorSessionActions } from "@/services/actions";
import { registerAction } from "./actionRegistrationModel";

export const editorDialActionRegistry = {
  dial: {
    cancelEdit: registerAction(
      "editor-session",
      editorSessionActions.editorCancelEdit,
      (nagger: Nagger) => ({ nagger }),
    ),
    deleteSelectedNode: registerAction(
      "editor",
      editorActions.editorDeleteSelectedNode,
      (deleteContext: SelectedDeleteContext) => ({ deleteContext }),
    ),
    moveSelectedNodeDown: registerAction(
      "editor",
      editorActions.editorMoveSelectedNodeDown,
      (moveContext: SelectedMoveContext) => ({ moveContext }),
    ),
    moveSelectedNodeUp: registerAction(
      "editor",
      editorActions.editorMoveSelectedNodeUp,
      (moveContext: SelectedMoveContext) => ({ moveContext }),
    ),
    pinSelectedNagger: registerAction(
      "editor",
      editorActions.naggerPinSelected,
      (nagger: Nagger) => ({ nagger }),
    ),
    saveEdit: registerAction(
      "editor-session",
      editorSessionActions.editorSaveEdit,
      (nagger: Nagger) => ({ nagger }),
    ),
    unpinSelectedNagger: registerAction(
      "editor",
      editorActions.naggerUnpinSelected,
      (nagger: Nagger) => ({ nagger }),
    ),
  },
} as const;

