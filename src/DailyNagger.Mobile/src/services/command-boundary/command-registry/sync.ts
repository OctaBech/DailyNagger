import { command } from "../commandScopes";
import { syncActions } from "../../actions";

export const syncCommandActions = {
  "nagger/pin-selected": command("sync", syncActions.naggerPinSelected),
  "nagger/unpin-selected": command("sync", syncActions.naggerUnpinSelected),
} as const;
