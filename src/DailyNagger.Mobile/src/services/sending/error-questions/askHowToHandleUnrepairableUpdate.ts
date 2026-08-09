import type { SendApiRequestError } from "@/api/client/sendApiRequest";
import type { ServerConfrontationBlock } from "../server-confrontation/useServerConfrontationBlock";

export async function askHowToHandleUnrepairableUpdate(
  serverConfrontationBlock: ServerConfrontationBlock,
  error: SendApiRequestError,
): Promise<void> {
  await serverConfrontationBlock.askUserForPermission({
    title: "Saved update cannot be repaired",
    message:
      "The server rejected this batch without a current version. DailyNagger can discard it and continue.",
    primaryActionLabel: "Discard batch",
    technicalMessage: error.message,
  });
}
