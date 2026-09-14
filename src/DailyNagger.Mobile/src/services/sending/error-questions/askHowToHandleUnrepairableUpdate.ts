import type { SendApiRequestError } from "@/api/client/sendApiRequest";
import type { SendingPromptController } from "../sending-prompt/useSendingPromptController";

export async function askHowToHandleUnrepairableUpdate(
  sendingPromptController: SendingPromptController,
  error: SendApiRequestError,
): Promise<void> {
  await sendingPromptController.askUserForSendingDecision({
    title: "Saved update cannot be repaired",
    message:
      "The server rejected this batch without a current version. DailyNagger can discard it and continue.",
    primaryActionLabel: "Discard batch",
    technicalMessage: error.message,
  });
}




