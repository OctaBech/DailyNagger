import {
  isNagger,
  isTaskEntry,
  isTaskLog,
  isUserMood,
  type Nagger,
  type TaskEntry,
  type TaskLog,
  type UserMood,
  type UserMoodLabel,
} from "@/models";
import {
  assertNever,
  type EventEmitter,
  type Guid,
  newGuid,
  type Prettify,
  useLock,
  useStableCallback,
  useTimer,
} from "@/shared";
import type { Memory } from "../contracts";
import { useClientIdentity } from "../clientIdentity";
import type { Formula, OwnerType, Parcel, SendingEventType } from "./contracts";
import { createNaggerFormula } from "./queueNagger";
import { createTaskEntryFormula } from "./queueTaskEntry";
import { createTaskLogFormula } from "./queueTaskLog";
import { createUserMoodFormula } from "./queueUserMood";
import { useSendQueue } from "./queue";
import { createSendBatchRequest } from "./request/createSendBatchRequest";
import { logServerRejectedQueuedUpdate } from "./logging/logServerRejectedQueuedUpdate";
import { useSendingPromptController } from "./sending-prompt/useSendingPromptController";
import { trySendRequest } from "./request/trySendRequest";
import { naggerToDto, taskLogToDto } from "@/services/model-conversion";
import { askHowToHandleUnrepairableUpdate, askHowToHandleVersioningError } from "./error-questions";
import { sendTimerConfig } from "./sendTimerConfig";
import { recordLegacyObservability, recordParcelQueued, type Observability } from "@/observability";
import { createParcelVersionStamp, restampBatchForForcedSend } from "@/services/parcel-versioning";

type SendableContent = Nagger | TaskLog | TaskEntry | UserMood;

export type SendingQueueOptions = {
  readonly observability: Observability;
};

export function useSending(
  versionMemory: Memory,
  sendingEvents: EventEmitter<SendingEventType, readonly Parcel[]>,
  getCurrentMood: () => UserMoodLabel | null,
) {
  const sendQueue = useSendQueue();
  const sendTimer = useTimer(sendTimerConfig);
  const clientIdentity = useClientIdentity();
  const sendLoopLock = useLock();
  const sendingPromptController = useSendingPromptController();

  const queue = useStableCallback(toPostOffice);

  function postOffice(content: SendableContent, options?: SendingQueueOptions) {
    const queuedAt = new Date().toISOString();

    const formula = getFormulaForContent(content);

    const versionStamp = formula.recipientExpectsVersioning
      ? createParcelVersionStamp({ memory: versionMemory, formula, queuedAt })
      : {};

    const unrecordedParcel = {
      formula,
      observability: options?.observability ?? recordLegacyObservability([]),
      stamp: {
        parcelId: newGuid(),
        queuedAt,
        mood: getCurrentMood(),
        clientIdentity,
        ...versionStamp,
      },
    } satisfies Parcel;
    const newParcel = {
      ...unrecordedParcel,
      observability: recordParcelQueued(unrecordedParcel.observability, {
        coalesceKey: unrecordedParcel.formula.coalesceKey,
        formulaType: unrecordedParcel.formula.type,
        ownerId: unrecordedParcel.formula.ownerId,
        ownerType: unrecordedParcel.formula.ownerType,
        parcelId: unrecordedParcel.stamp.parcelId,
      }),
    } satisfies Parcel;

    const addResult = sendQueue.add(newParcel);

    switch (addResult.kind) {
      case "added":
        sendingEvents.emit("parcel-queued", [addResult.parcel]);
        break;
      case "coalesced":
        sendingEvents.emit("parcel-coalesced", [addResult.oldParcel, addResult.coalescedParcel]);
        break;
    }

    sendTimer.set("debounced", processSendQueue);
  }

  function getFormulaForContent(content: SendableContent): Formula {
    if ("nodeType" in content) {
      if (isNagger(content)) return createNaggerFormula(naggerToDto(content));
      if (isTaskLog(content)) return createTaskLogFormula(taskLogToDto(content));
      if (isTaskEntry(content)) return createTaskEntryFormula(content);
    }

    if (isUserMood(content)) return createUserMoodFormula(content);

    throw new Error("Cannot queue content because no sending formula matches it.");
  }

  async function processSendQueue(): Promise<boolean> {
    sendTimer.stop();

    if (!sendQueue.hasElements()) return true;
    if (sendingPromptController.hasPendingSendingPrompt()) return false;
    if (!sendLoopLock.tryLock()) return false;

    const batch = sendQueue.startNextBatch();
    const request = createSendBatchRequest(batch);
    const sendResult = await trySendRequest(request).finally(() => {
      sendLoopLock.releaseLock();
    });

    switch (sendResult.kind) {
      case "sent":
        sendQueue.removeActiveBatch();
        sendingEvents.emit("batch-sent", batch);
        sendTimer.resetBackoff();
        sendTimer.set("debounced", processSendQueue);
        return true;

      case "server-rejected-current-version":
        logServerRejectedQueuedUpdate(sendResult.error, batch);
        sendingEvents.emit("batch-rejected-current-version", batch);
        sendingEvents.emit("batch-blocked-current-version", batch);

        const decision = await askHowToHandleVersioningError(
          sendingPromptController,
          sendResult.error,
        );

        if (decision === "force-batch") {
          sendQueue.replaceActiveBatch(
            restampBatchForForcedSend({
              batch,
              memory: versionMemory,
              serverVersion: sendResult.serverVersion,
            }),
          );
          sendingEvents.emit("batch-forced", batch);
        } else {
          sendQueue.removeActiveBatch();
          sendingEvents.emit("batch-discarded-current-version", batch);
          sendingEvents.emit("batch-discarded", batch);
        }

        sendTimer.set("debounced", processSendQueue);
        return true;

      case "server-rejected-unrepairable-update":
        logServerRejectedQueuedUpdate(sendResult.error, batch);
        sendingEvents.emit("batch-rejected-unrepairable", batch);
        sendingEvents.emit("batch-blocked-unrepairable", batch);

        await askHowToHandleUnrepairableUpdate(sendingPromptController, sendResult.error);
        sendQueue.removeActiveBatch();
        sendingEvents.emit("batch-discarded-unrepairable", batch);
        sendingEvents.emit("batch-discarded", batch);
        sendTimer.set("debounced", processSendQueue);
        return true;

      case "failed-to-connect":
        logServerRejectedQueuedUpdate(sendResult.error, batch);
        sendingEvents.emit("batch-failed-to-connect", batch);
        sendQueue.releaseActiveBatch();
        sendTimer.set("lostConnectionBackoff", processSendQueue);
        return false;

      default:
        assertNever(sendResult);
    }
  }

  async function flushQueue(): Promise<FlushQueueResult> {
    sendTimer.disable();
    announceQueueContent();

    try {
      while (sendQueue.hasElements()) {
        const serverWasReachable = await processSendQueue();
        if (!serverWasReachable) return { kind: "server-unreachable" };
      }

      return { kind: "flushed" };
    } finally {
      sendTimer.enable();
    }
  }

  function announceQueueContent(): void {
    const queuedParcels = sendQueue.getAll();
    if (queuedParcels.length === 0) return;

    sendingEvents.emit("parcel-queued", queuedParcels);
  }

  function hasUpdateBelongingToRootNode(versionOwnerType: OwnerType, versionOwnerId: Guid): boolean {
    return sendQueue.hasUpdateBelongingToRootNode(versionOwnerType, versionOwnerId);
  }

  function toPostOffice(content: SendableContent, options?: SendingQueueOptions): void {
    postOffice(content, options);
  }

  return {
    pendingSendingPrompt: {
      state: sendingPromptController.state,
      accept: sendingPromptController.accept,
      chooseSecondaryAction: sendingPromptController.chooseSecondaryAction,
    },
    queue,
    hasUpdateBelongingToRootNode,
    flushQueue,
  };
}

type FlushQueueResult = { readonly kind: "flushed" } | { readonly kind: "server-unreachable" };

export type Sending = Prettify<ReturnType<typeof useSending>>;

export type ActionSending = Prettify<
  Omit<Sending, "queue"> & {
    readonly queue: (content: SendableContent) => void;
  }
>;





