import type { Guid } from "@/shared";
import type { UserMoodLabel } from "@/models";
import type { Memory } from "../../contracts";
import type { OwnerType } from "../contracts";
import type { SendableContent } from "./contracts";
import { useSendingPromptController } from "../sending-prompt/useSendingPromptController";
import { useCreateParcel } from "./useCreateParcel";
import { useParcelQueue } from "./useParcelQueue";
import { useSendParcelBatch } from "./useSendParcelBatch";
import { useParcelFlowEvents, type ParcelFlowEvents } from "./events";
import type { ParcelQueueMiddleware } from "./parcelQueueMiddleware";

export function useParcelSending(
  versionMemory: Memory,
  getCurrentMood: () => UserMoodLabel | null,
  parcelQueueMiddleware?: ParcelQueueMiddleware,
  providedParcelFlowEvents?: ParcelFlowEvents,
) {
  const createdParcelFlowEvents = useParcelFlowEvents();
  const parcelFlowEvents = providedParcelFlowEvents ?? createdParcelFlowEvents;
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

  async function flushQueue(): Promise<FlushQueueResult> {
    const serverWasReachable = await drainQueue();

    return serverWasReachable ? { kind: "flushed" } : { kind: "server-unreachable" };
  }

  function hasUpdateBelongingToRootNode(
    versionOwnerType: OwnerType,
    versionOwnerId: Guid,
  ): boolean {
    return parcelQueue.hasUpdateBelongingToRootNode(versionOwnerType, versionOwnerId);
  }

  return {
    drainQueue,
    flushQueue,
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

type FlushQueueResult = { readonly kind: "flushed" } | { readonly kind: "server-unreachable" };

export type ParcelSending = ReturnType<typeof useParcelSending>;
