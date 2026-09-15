import { useCallback, useEffect, useRef, useState } from "react";
import type { Guid } from "@/shared";
import { useTimer } from "@/shared";
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
import { emitParcelBatchEvent, type ParcelFlowEvents } from "./events";
import type { ParcelQueueMiddleware } from "./middleware";
import { persistentStorage } from "./persistentStorage";

export function useParcelQueue(
  sendParcelBatch: SendParcelBatch,
  parcelFlowEvents?: ParcelFlowEvents,
  parcelQueueMiddleware: ParcelQueueMiddleware = {},
) {
  const [loadedQueue] = useState(() => persistentStorage.load());
  const parcelsRef = useRef<Parcel[]>(loadedQueue.parcels);
  const activeBatchLengthRef = useRef(0);
  const parcelBatchTimer = useTimer(sendTimerConfig);

  const announceQueueContent = useCallback((): void => {
    for (const parcel of parcelsRef.current) {
      parcelFlowEvents?.emit("parcel.queued", {
        parcel,
        parcels: [parcel],
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
    const oldParcel = removeCoalescingParcel(coalescingIndex);

    // 3. Insert the new payload last, with backend versioning merged from both parcels.
    const parcelToInsert =
      oldParcel === null ? parcel : withMergedVersioning([oldParcel, parcel], parcel);
    const queuedParcel = addMiddlewarePayload(parcelToInsert);

    parcelsRef.current.push(queuedParcel);
    persistParcels();
    if (oldParcel === null) {
      parcelFlowEvents?.emit("parcel.queued", { parcel: queuedParcel, parcels: [queuedParcel] });
    } else {
      parcelFlowEvents?.emit("parcel.coalesced", {
        parcel: queuedParcel,
        replacedParcel: oldParcel,
        parcels: [oldParcel, queuedParcel],
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

  function removeCoalescingParcel(coalescingIndex: number): Parcel | null {
    if (coalescingIndex === -1) {
      return null;
    }

    const [oldParcel] = parcelsRef.current.splice(coalescingIndex, 1);
    return oldParcel;
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
    const instruction = await runParcelBatchSend(batch, () => sendParcelBatch(batch));

    // 3. The queue applies the instruction and decides whether to schedule more work.
    await applyParcelBatchInstruction(instruction, options);

    return instruction !== "keep-active-batch-and-backoff";
  }

  function createNextParcelBatch(): ParcelBatch {
    // 1. The first parcel decides which queued neighbours may join this batch.
    const firstParcel = getFirstQueuedParcel();

    // 2. The queue chooses the batch boundary.
    const parcels = takeBatchFromQueueFront(firstParcel);

    // 3. The owner of the batch boundary also owns the backend version range.
    const batch = {
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
    return parcelsRef.current.length > 0;
  }

  function hasUpdateBelongingToRootNode(versionOwnerType: OwnerType, versionOwnerId: Guid): boolean {
    return parcelsRef.current.some(
      (parcel) =>
        parcel.formula.ownerType === versionOwnerType && parcel.formula.ownerId === versionOwnerId,
    );
  }

  function persistParcels(): void {
    persistentStorage.save(parcelsRef.current);
  }

  function removeActiveBatch(): void {
    if (activeBatchLengthRef.current === 0) return;

    parcelsRef.current.splice(0, activeBatchLengthRef.current);
    activeBatchLengthRef.current = 0;
    persistParcels();
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

  function addMiddlewarePayload(parcel: Parcel): Parcel {
    return {
      ...parcelQueueMiddleware.getPayloadForQueuedParcel?.(parcel),
      ...parcel,
    };
  }

  function runParcelBatchSend(
    batch: ParcelBatch,
    run: () => Promise<ParcelQueueInstruction>,
  ): Promise<ParcelQueueInstruction> {
    return parcelQueueMiddleware.runParcelBatchSend?.(batch, run) ?? run();
  }

  function getFirstQueuedParcel(): Parcel {
    const firstParcel = parcelsRef.current[0];

    if (firstParcel === undefined) {
      throw new Error("Cannot start parcel batch because the queue is empty.");
    }

    return firstParcel;
  }

  function takeBatchFromQueueFront(firstParcel: Parcel): Parcel[] {
    if (!firstParcel.formula.canBatch) return [firstParcel];

    const batch: Parcel[] = [];

    for (const parcel of parcelsRef.current) {
      if (!belongsToSameBatch(parcel, firstParcel)) break;
      batch.push(parcel);
    }

    return batch;
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
    for (let index = parcelsRef.current.length - 1; index >= activeBatchLengthRef.current; index--) {
      const queuedParcel = parcelsRef.current[index];

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
