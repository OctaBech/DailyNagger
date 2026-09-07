import { editorCommandActions } from "./editor";
import { editorSessionCommandActions } from "./editor-session";
import { navigationCommandActions } from "./navigation";
import { syncCommandActions } from "./sync";
import { taskInputCommandActions } from "./task-input";

export const commandActions = {
  ...editorCommandActions,
  ...editorSessionCommandActions,
  ...navigationCommandActions,
  ...syncCommandActions,
  ...taskInputCommandActions,
} as const;
