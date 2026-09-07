import { command } from "../commandScopes";
import { naggerPinSelected, naggerUnpinSelected } from "../commandHandlers";

export const syncCommandActions = {
  "nagger/pin-selected": command("sync", naggerPinSelected),
  "nagger/unpin-selected": command("sync", naggerUnpinSelected),
} as const;
