import type { Guid } from "@/shared";
import type { UserMoodLabel } from "@/models";
import type { Memory } from "../../contracts";
import type { OwnerType } from "../contracts";
import type { Parcel, SendableContent } from "./contracts";
import { useSendingPromptController } from "../sending-prompt/useSendingPromptController";
import { useCreateParcel } from "./useCreateParcel";
import { useParcelQueue } from "./useParcelQueue";
import { useSendParcelBatch } from "./useSendParcelBatch";
import { useParcelFlowEvents } from "./events";
import type { ParcelQueueMiddleware } from "./middleware";

export function useParcelSending(
  versionMemory: Memory,
  getCurrentMood: () => UserMoodLabel | null,
  parcelQueueMiddleware?: ParcelQueueMiddleware,
) {
  const parcelFlowEvents = useParcelFlowEvents();
  const createParcel = useCreateParcel(versionMemory, getCurrentMood, parcelFlowEvents);
  const sendingPromptController = useSendingPromptController();
  const sendParcelBatch = useSendParcelBatch(sendingPromptController, parcelFlowEvents);
  const parcelQueue = useParcelQueue(sendParcelBatch, parcelFlowEvents, parcelQueueMiddleware);

  function queue(content: SendableContent): void {
    // 1. Create a parcel from sendable content.
    const parcel = createParcel(content);

    // 2. The parcel queue owns insertion, coalescing, persistence, and scheduling.
    parcelQueue.insertParcel(parcel);
  }

  function drainQueue(): Promise<boolean> {
    // Drain means: keep processing batches without waiting for the debounce timer.
    return parcelQueue.processNextParcelBatch({ drain: true });
  }

  function hasUpdateBelongingToRootNode(versionOwnerType: OwnerType, versionOwnerId: Guid): boolean {
    return parcelQueue.hasUpdateBelongingToRootNode(versionOwnerType, versionOwnerId);
  }

  return {
    drainQueue,
    hasUpdateBelongingToRootNode,
    queue,
    parcelFlowEvents,
    pendingSendingPrompt: {
      state: sendingPromptController.state,
      accept: sendingPromptController.accept,
      chooseSecondaryAction: sendingPromptController.chooseSecondaryAction,
    },
  };
}

export type ParcelSending = ReturnType<typeof useParcelSending>;









