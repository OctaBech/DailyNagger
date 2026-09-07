import { command } from "../commandScopes";
import {
  naggerSetExpanded,
  naggerSetFocused,
  taskEntrySetFocused,
  taskItemSetExpanded,
  taskItemSetFocused,
  taskLogSetFocused,
} from "../commandHandlers";

export const navigationCommandActions = {
  "nagger/set-expanded": command("navigation", naggerSetExpanded),
  "nagger/set-focused": command("navigation", naggerSetFocused),
  "task-log/set-focused": command("navigation", taskLogSetFocused),
  "task-item/set-expanded": command("navigation", taskItemSetExpanded),
  "task-item/set-focused": command("navigation", taskItemSetFocused),
  "task-entry/set-focused": command("navigation", taskEntrySetFocused),
} as const;
