import { command } from "../commandScopes";
import { editorSessionActions } from "../../actions";

export const editorSessionCommandActions = {
  "editor/cancel": command("editor-session", editorSessionActions.editorCancelEdit),
  "editor/save": command("editor-session", editorSessionActions.editorSaveEdit),
  "editor/start-edit": command("editor-session", editorSessionActions.editorStartEdit),
} as const;
