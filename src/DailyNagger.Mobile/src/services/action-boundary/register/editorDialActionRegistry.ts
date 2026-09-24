import type { Nagger, SelectedDeleteContext, SelectedMoveContext } from "@/models";
import { editorActions, editorSessionActions } from "@/services/actions";
import { registerAction } from "./actionRegistrationModel";

export const editorDialActionRegistry = {
  dial: {
    cancelEdit: registerAction(
      editorSessionActions.editorCancelEdit,
      (nagger: Nagger) => ({ nagger }),
      "editor/session",
    ),
    deleteSelectedNode: registerAction(
      editorActions.editorDeleteSelectedNode,
      (deleteContext: SelectedDeleteContext) => ({ deleteContext }),
      "editor/action",
    ),
    moveSelectedNodeDown: registerAction(
      editorActions.editorMoveSelectedNodeDown,
      (moveContext: SelectedMoveContext) => ({ moveContext }),
      "editor/action",
    ),
    moveSelectedNodeUp: registerAction(
      editorActions.editorMoveSelectedNodeUp,
      (moveContext: SelectedMoveContext) => ({ moveContext }),
      "editor/action",
    ),
    pinSelectedNagger: registerAction(
      editorActions.naggerPinSelected,
      (nagger: Nagger) => ({ nagger }),
      "editor/action",
    ),
    saveEdit: registerAction(
      editorSessionActions.editorSaveEdit,
      (nagger: Nagger) => ({ nagger }),
      "editor/session",
    ),
    unpinSelectedNagger: registerAction(
      editorActions.naggerUnpinSelected,
      (nagger: Nagger) => ({ nagger }),
      "editor/action",
    ),
  },
} as const;
