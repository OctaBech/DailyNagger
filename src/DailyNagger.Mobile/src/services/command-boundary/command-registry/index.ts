import { editorCommandActions } from "./editor";
import { editorSessionCommandActions } from "./editor-session";
import { navigationCommandActions } from "./navigation";
import { taskInputCommandActions } from "./task-input";

export const commandActions = {
  ...editorCommandActions,
  ...editorSessionCommandActions,
  ...navigationCommandActions,
  ...taskInputCommandActions,
} as const;
