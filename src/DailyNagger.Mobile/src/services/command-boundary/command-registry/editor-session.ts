import { command } from "../commandScopes";
import { editorCancel, editorSave, editorStartEdit } from "../commandHandlers";

export const editorSessionCommandActions = {
  "editor/cancel": command("editor-session", editorCancel),
  "editor/save": command("editor-session", editorSave),
  "editor/start-edit": command("editor-session", editorStartEdit),
} as const;
