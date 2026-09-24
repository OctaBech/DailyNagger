import { useCallback, useEffect, useRef, useState } from "react";
import { hibernateMiddlewareContext, runWithAwakenedMiddlewareContext } from "@/middleware";
import type { Guid } from "@/shared";
import { useTimer } from "@/shared/useTimer";
import type { OwnerType } from "../contracts";
import { sendTimerConfig } from "../sendTimerConfig";
import { mergeParcelVersioning } from "../parcelVersioning/mergeParcelVersioning";
import type {
  Parcel,
  ParcelBatch,
  ParcelBatchScheduleDelay,
  ParcelQueueInstruction,
  ProcessNextParcelBatchOptions,
  SendParcelBatch,
} from "./contracts";
import { emitParcelBatchEvent } from "./events/emitParcelBatchEvent";
import type { ParcelFlowEvents } from "./events/contracts";
import type { ParcelQueueMiddleware } from "./parcelQueueMiddleware";
import { persistentStorage, type QueuedParcel } from "./persistentStorage";

export function useParcelQueue(
  sendParcelBatch: SendParcelBatch,
  parcelFlowEvents?: ParcelFlowEvents,
  parcelQueueMiddleware: ParcelQueueMiddleware = {},
) {
  const [loadedQueue] = useState(() => persistentStorage.load());
  const queueEntriesRef = useRef<QueuedParcel[]>(loadedQueue.queueEntries);
  const activeBatchLengthRef = useRef(0);
  const parcelBatchTimer = useTimer(sendTimerConfig);

  const announceQueueContent = useCallback((): void => {
    for (const queueEntry of queueEntriesRef.current) {
      parcelFlowEvents?.emit("parcel.queued", {
        parcel: queueEntry.parcel,
        parcels: [queueEntry.parcel],
      });
    }
  }, [parcelFlowEvents]);

  useEffect(() => {
    if (loadedQueue.startupWarning !== null) {
      parcelFlowEvents?.emit("sending.queue.mmkv_restore_failed", {});
    }

    announceQueueContent();
  }, [announceQueueContent, loadedQueue.startupWarning, parcelFlowEvents]);

  function insertParcel(parcel: Parcel): void {
    // 1. Look for a queued parcel that the new parcel can replace.
    const coalescingIndex = findCoalescingIndex(parcel);

    // 2. Remove the old parcel first, so the queue story is always remove -> append.
    const oldQueueEntry = removeCoalescingQueueEntry(coalescingIndex);
    const oldParcel = oldQueueEntry?.parcel ?? null;

    // 3. Insert the new parcel last, with backend versioning merged from both parcels.
    const parcelToInsert =
      oldParcel === null ? parcel : withMergedVersioning([oldParcel, parcel], parcel);
    const queueEntry = createQueueEntry(parcelToInsert);

    queueEntriesRef.current.push(queueEntry);
    persistQueueEntries();
    if (oldParcel === null) {
      parcelFlowEvents?.emit("parcel.queued", {
        parcel: queueEntry.parcel,
        parcels: [queueEntry.parcel],
      });
    } else {
      parcelFlowEvents?.emit("parcel.coalesced", {
        parcel: queueEntry.parcel,
        replacedParcel: oldParcel,
        parcels: [oldParcel, queueEntry.parcel],
      });
    }
    scheduleNextParcelBatch("debounced");
  }

  function scheduleNextParcelBatch(delay: ParcelBatchScheduleDelay): void {
    // The queue owns when the next batch is attempted.
    // Callers only choose the delay policy from config language.
    if (delay === "immediate") {
      void processNextParcelBatch();
      return;
    }

    parcelBatchTimer.set(delay, async () => {
      return processNextParcelBatch();
    });
  }

  function removeCoalescingQueueEntry(coalescingIndex: number): QueuedParcel | null {
    if (coalescingIndex === -1) {
      return null;
    }

    const [oldQueueEntry] = queueEntriesRef.current.splice(coalescingIndex, 1);
    return oldQueueEntry;
  }

  async function processNextParcelBatch(
    options: ProcessNextParcelBatchOptions = {},
  ): Promise<boolean> {
    parcelBatchTimer.stop();

    if (activeBatchLengthRef.current !== 0) return false;
    if (!hasElements()) return true;

    // 1. The queue chooses and marks the next batch.
    const batch = createNextParcelBatch();

    // 2. The sender handles server communication and returns a queue instruction.
    const instruction = await runWithAwakenedMiddlewareContext(
      parcelQueueMiddleware,
      batch.middlewareContexts,
      () => sendParcelBatch(batch),
    );

    // 3. The queue applies the instruction and decides whether to schedule more work.
    await applyParcelBatchInstruction(instruction, options);

    return instruction !== "keep-active-batch-and-backoff";
  }

  function createNextParcelBatch(): ParcelBatch {
    // 1. The first parcel decides which queued neighbours may join this batch.
    const firstParcel = getFirstQueuedParcel();

    // 2. The queue chooses the batch boundary.
    const queueEntries = takeBatchFromQueueFront(firstParcel);
    const parcels = queueEntries.map((queueEntry) => queueEntry.parcel);

    // 3. The owner of the batch boundary also owns the backend version range.
    const batch = {
      middlewareContexts: queueEntries.map((queueEntry) => queueEntry.middlewareContext),
      parcels,
      versioning: mergeParcelVersioning(parcels),
    } satisfies ParcelBatch;

    activeBatchLengthRef.current = parcels.length;
    emitParcelBatchEvent(parcelFlowEvents, "parcel.batch.waiting", batch);
    return batch;
  }

  async function applyParcelBatchInstruction(
    instruction: ParcelQueueInstruction,
    options: ProcessNextParcelBatchOptions,
  ): Promise<void> {
    switch (instruction) {
      case "remove-active-batch-and-drain-next":
        removeActiveBatch();
        parcelBatchTimer.resetBackoff();
        if (options.drain === true) {
          await processNextParcelBatch(options);
          return;
        }

        scheduleNextParcelBatch("debounced");
        return;
      case "remove-active-batch-and-stop":
        removeActiveBatch();
        parcelBatchTimer.resetBackoff();
        return;
      case "keep-active-batch-and-backoff":
        releaseActiveBatch();
        scheduleNextParcelBatch("lostConnectionBackoff");
        return;
      case "keep-active-batch-and-stop":
        releaseActiveBatch();
        return;
    }
  }

  function hasElements(): boolean {
    return queueEntriesRef.current.length > 0;
  }

  function hasUpdateBelongingToRootNode(
    versionOwnerType: OwnerType,
    versionOwnerId: Guid,
  ): boolean {
    return queueEntriesRef.current.some(
      (queueEntry) =>
        queueEntry.parcel.formula.ownerType === versionOwnerType &&
        queueEntry.parcel.formula.ownerId === versionOwnerId,
    );
  }

  function persistQueueEntries(): void {
    persistentStorage.save(queueEntriesRef.current);
  }

  function removeActiveBatch(): void {
    if (activeBatchLengthRef.current === 0) return;

    queueEntriesRef.current.splice(0, activeBatchLengthRef.current);
    activeBatchLengthRef.current = 0;
    persistQueueEntries();
  }

  function releaseActiveBatch(): void {
    activeBatchLengthRef.current = 0;
  }

  function withMergedVersioning(parcels: readonly Parcel[], parcel: Parcel): Parcel {
    const versioning = mergeParcelVersioning(parcels);

    return {
      ...parcel,
      stamp: {
        ...parcel.stamp,
        baseVersion: versioning.existingVersion,
        nextVersion: versioning.newVersion,
      },
    };
  }

  function createQueueEntry(parcel: Parcel): QueuedParcel {
    return {
      middlewareContext: hibernateMiddlewareContext(parcelQueueMiddleware),
      parcel,
    };
  }

  function getFirstQueuedParcel(): Parcel {
    const firstQueueEntry = queueEntriesRef.current[0];

    if (firstQueueEntry === undefined) {
      throw new Error("Cannot start parcel batch because the queue is empty.");
    }

    return firstQueueEntry.parcel;
  }

  function takeBatchFromQueueFront(firstParcel: Parcel): QueuedParcel[] {
    if (!firstParcel.formula.canBatch) return [getFirstQueueEntry()];

    const batch: QueuedParcel[] = [];

    for (const queueEntry of queueEntriesRef.current) {
      if (!belongsToSameBatch(queueEntry.parcel, firstParcel)) break;
      batch.push(queueEntry);
    }

    return batch;
  }

  function getFirstQueueEntry(): QueuedParcel {
    const firstQueueEntry = queueEntriesRef.current[0];

    if (firstQueueEntry === undefined) {
      throw new Error("Cannot start parcel batch because the queue is empty.");
    }

    return firstQueueEntry;
  }

  function belongsToSameBatch(parcel: Parcel, firstParcel: Parcel): boolean {
    const sameVersionOwner =
      parcel.formula.ownerType === firstParcel.formula.ownerType &&
      parcel.formula.ownerId === firstParcel.formula.ownerId;

    return sameVersionOwner && parcel.formula.type === firstParcel.formula.type;
  }

  // Coalescing only looks inside the inactive queue.
  // Active batches are already being sent and must not be rewritten under the sender.
  function findCoalescingIndex(newParcel: Parcel): number {
    for (
      let index = queueEntriesRef.current.length - 1;
      index >= activeBatchLengthRef.current;
      index--
    ) {
      const queuedParcel = queueEntriesRef.current[index]?.parcel;
      if (queuedParcel === undefined) continue;

      const sameVersionOwner =
        queuedParcel.formula.ownerType === newParcel.formula.ownerType &&
        queuedParcel.formula.ownerId === newParcel.formula.ownerId;

      if (!sameVersionOwner) continue;
      if (queuedParcel.formula.type !== newParcel.formula.type) return -1;
      if (queuedParcel.formula.coalesceKey === newParcel.formula.coalesceKey) return index;
    }

    return -1;
  }

  return {
    hasElements,
    hasUpdateBelongingToRootNode,
    insertParcel,
    processNextParcelBatch,
  };
}

export type ParcelQueue = ReturnType<typeof useParcelQueue>;
