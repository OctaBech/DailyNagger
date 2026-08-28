import { useRef, useState } from "react";
import type { Parcel, OwnerType } from "../contracts";
import type { Guid } from "@/shared";
import { sendQueueStorage } from "./sendQueueStorage";
import { mergeCausalityKeys } from "@/observability/causalityKeyList";

export function useSendQueue() {
  const [loadedQueue] = useState(() => sendQueueStorage.load());
  const queueRef = useRef<Parcel[]>(loadedQueue.queue);
  const activeBatchLengthRef = useRef(0);
  const [count, setCount] = useState(loadedQueue.queue.length);

  function add(newParcel: Parcel): AddParcelResult {
    const index = findCoalescingIndex(newParcel);

    if (index === -1) {
      queueRef.current.push(newParcel);
      persistQueue();
      return { kind: "added", parcel: newParcel };
    }

    const oldParcel = queueRef.current[index];
    const coalescedParcel = coalesceParcelStamps(oldParcel, newParcel);

    queueRef.current[index] = coalescedParcel;
    persistQueue();

    return { kind: "coalesced", oldParcel, newParcel: coalescedParcel };
  }

  function coalesceParcelStamps(oldParcel: Parcel, newParcel: Parcel): Parcel {
    return {
      ...newParcel,
      stamp: {
        ...newParcel.stamp,
        baseVersion: oldParcel.stamp.baseVersion,
        causalityKeys: mergeCausalityKeys(
          oldParcel.stamp.causalityKeys,
          newParcel.stamp.causalityKeys,
        ),
      },
    };
  }

  function replaceActiveBatch(newBatch: readonly Parcel[]): void {
    if (activeBatchLengthRef.current === 0) {
      throw new Error("Cannot replace active parcel batch because no batch is active.");
    }

    if (activeBatchLengthRef.current !== newBatch.length) {
      throw new Error("Cannot replace queued parcel batch because the batch lengths differ.");
    }

    queueRef.current.splice(0, activeBatchLengthRef.current, ...newBatch);
    activeBatchLengthRef.current = 0;
    persistQueue();
  }

  function hasElements(): boolean {
    return queueRef.current.length > 0;
  }

  function getAll(): readonly Parcel[] {
    return queueRef.current;
  }

  function hasUpdateBelongingTo(versionOwnerType: OwnerType, versionOwnerId: Guid): boolean {
    return queueRef.current.some(
      (queuedSend) =>
        queuedSend.formula.ownerType === versionOwnerType &&
        queuedSend.formula.ownerId === versionOwnerId,
    );
  }

  function startNextBatch(): Parcel[] {
    if (activeBatchLengthRef.current !== 0) {
      throw new Error("Cannot start next parcel batch because another batch is active.");
    }

    const firstQueuedSend = queueRef.current[0];

    if (firstQueuedSend === undefined) {
      throw new Error("Cannot get next parcel batch because the parcel queue is empty.");
    }

    if (!firstQueuedSend.formula.canBatch) {
      activeBatchLengthRef.current = 1;
      return [firstQueuedSend];
    }

    const batch: Parcel[] = [];

    for (const queuedSend of queueRef.current) {
      const sameVersionOwner =
        queuedSend.formula.ownerType === firstQueuedSend.formula.ownerType &&
        queuedSend.formula.ownerId === firstQueuedSend.formula.ownerId;

      if (!sameVersionOwner) break;

      if (queuedSend.formula.type !== firstQueuedSend.formula.type) break;

      batch.push(queuedSend);
    }

    activeBatchLengthRef.current = batch.length;
    return batch;
  }

  function removeActiveBatch(): void {
    if (activeBatchLengthRef.current === 0) {
      throw new Error("Cannot remove active parcel batch because no batch is active.");
    }

    queueRef.current.splice(0, activeBatchLengthRef.current);
    activeBatchLengthRef.current = 0;
    persistQueue();
  }

  function releaseActiveBatch(): void {
    if (activeBatchLengthRef.current === 0) return;

    activeBatchLengthRef.current = 0;
  }

  function clear(): void {
    activeBatchLengthRef.current = 0;
    queueRef.current = [];
    persistQueue();
  }

  function persistQueue(): void {
    sendQueueStorage.save(queueRef.current);
    setCount(queueRef.current.length);
  }

  // Coalescing may only look backwards within the same version owner.
  // A different parcel type for the same owner is a hard boundary, because it may
  // change the aggregate shape and must preserve parcel order. The same parcel type
  // with the same coalesce key can be replaced by the newer element.
  function findCoalescingIndex(newParcel: Parcel): number {
    for (let index = queueRef.current.length - 1; index >= activeBatchLengthRef.current; index--) {
      const queued = queueRef.current[index];

      const sameVersionOwner =
        queued.formula.ownerType === newParcel.formula.ownerType &&
        queued.formula.ownerId === newParcel.formula.ownerId;

      if (!sameVersionOwner) continue;

      if (queued.formula.type !== newParcel.formula.type) return -1;

      if (queued.formula.coalesceKey === newParcel.formula.coalesceKey) return index;
    }

    return -1;
  }

  return {
    add,
    releaseActiveBatch,
    removeActiveBatch,
    replaceActiveBatch,
    getAll,
    startNextBatch,
    hasElements,
    hasUpdateBelongingTo,
    clear,
    count,
    startupWarning: loadedQueue.startupWarning,
  };
}

export type SendQueue = ReturnType<typeof useSendQueue>;

type AddParcelResult =
  | {
      readonly kind: "added";
      readonly parcel: Parcel;
    }
  | {
      readonly kind: "coalesced";
      readonly oldParcel: Parcel;
      readonly newParcel: Parcel;
    };
