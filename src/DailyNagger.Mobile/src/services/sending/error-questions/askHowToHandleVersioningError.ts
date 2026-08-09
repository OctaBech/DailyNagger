import type { SendApiRequestError } from "@/api/client/sendApiRequest";
import type { ServerConfrontationBlock } from "../server-confrontation/useServerConfrontationBlock";

export type VersioningErrorDecision = "force-batch" | "discard-batch";

export async function askHowToHandleVersioningError(
  serverConfrontationBlock: ServerConfrontationBlock,
  error: SendApiRequestError,
): Promise<VersioningErrorDecision> {
  const shouldForceBatch = await serverConfrontationBlock.askUserForPermission({
    title: "Version conflict",
    message:
      "The server has a newer version. DailyNagger can force this batch through or discard it.",
    primaryActionLabel: "Force update",
    secondaryActionLabel: "Discard batch",
    technicalMessage: error.message,
  });

  return shouldForceBatch ? "force-batch" : "discard-batch";
}
