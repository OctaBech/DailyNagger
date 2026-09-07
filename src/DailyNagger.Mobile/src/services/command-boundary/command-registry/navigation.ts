import { command } from "../commandScopes";
import { navigationActions } from "../../actions";

export const navigationCommandActions = {
  "nagger/set-expanded": command("navigation", navigationActions.naggerSetExpanded),
  "nagger/set-focused": command("navigation", navigationActions.naggerSetFocused),
  "task-log/set-focused": command("navigation", navigationActions.taskLogSetFocused),
  "task-item/set-expanded": command("navigation", navigationActions.taskItemSetExpanded),
  "task-item/set-focused": command("navigation", navigationActions.taskItemSetFocused),
  "task-entry/set-focused": command("navigation", navigationActions.taskEntrySetFocused),
} as const;
