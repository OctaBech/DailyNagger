import { getUserMoodEmoji, postOfficeStripConfig } from "@/config";
import type { Parcel } from "@/services";
import type { VisualParcel } from "./postOfficeStripModel";

export const postBoxSlot = postOfficeStripConfig.queueSlotCount;
export const totalSlotCount =
  postOfficeStripConfig.queueSlotCount + postOfficeStripConfig.exitSlotCount + 1;

export function addQueuedParcels(
  visualParcels: readonly VisualParcel[],
  parcels: readonly Parcel[],
): readonly VisualParcel[] {
  const knownParcelIds = new Set(visualParcels.map((visualParcel) => visualParcel.parcelId));
  const newVisualParcels = parcels
    .filter((parcel) => !knownParcelIds.has(parcel.stamp.parcelId))
    .map((parcel) => createVisualParcel(parcel));

  return placeNewVisualParcelsInWaitingLine(visualParcels, newVisualParcels);
}

export function markCoalescedParcel(
  visualParcels: readonly VisualParcel[],
  parcels: readonly Parcel[],
): readonly VisualParcel[] {
  const [oldParcel, newParcel] = parcels;
  if (oldParcel === undefined || newParcel === undefined) return visualParcels;

  const oldParcelId = oldParcel.stamp.parcelId;

  const coalescedVisualParcels = visualParcels.map((visualParcel) => {
    if (visualParcel.parcelId !== oldParcelId) return visualParcel;

    return {
      ...visualParcel,
      walkingEmoji: postOfficeStripConfig.coalescedEmoji,
      standingEmoji: postOfficeStripConfig.coalescedEmoji,
      exitEmoji: postOfficeStripConfig.coalescedEmoji,
      canPassPostBox: true,
    };
  });

  return addQueuedParcels(coalescedVisualParcels, [newParcel]);
}

export function markBatchResult(
  visualParcels: readonly VisualParcel[],
  parcels: readonly Parcel[],
  emoji: string,
): readonly VisualParcel[] {
  const parcelIds = new Set(parcels.map((parcel) => parcel.stamp.parcelId));

  return visualParcels.map((visualParcel) => {
    if (!parcelIds.has(visualParcel.parcelId)) return visualParcel;

    return {
      ...visualParcel,
      exitEmoji: emoji,
      canPassPostBox: true,
    };
  });
}

export function markBatchWaitingAtPostBox(
  visualParcels: readonly VisualParcel[],
  parcels: readonly Parcel[],
): readonly VisualParcel[] {
  const parcelIds = new Set(parcels.map((parcel) => parcel.stamp.parcelId));

  return visualParcels.map((visualParcel) => {
    if (!parcelIds.has(visualParcel.parcelId)) return visualParcel;

    return {
      ...visualParcel,
      slot: Math.min(visualParcel.slot, postBoxSlot - 1),
      standingEmoji: postOfficeStripConfig.failedToConnectEmoji,
      canPassPostBox: false,
    };
  });
}

export function markBatchWaitingForUserDecision(
  visualParcels: readonly VisualParcel[],
  parcels: readonly Parcel[],
  emoji: string,
): readonly VisualParcel[] {
  const parcelIds = new Set(parcels.map((parcel) => parcel.stamp.parcelId));

  return visualParcels.map((visualParcel) => {
    if (!parcelIds.has(visualParcel.parcelId)) return visualParcel;

    return {
      ...visualParcel,
      slot: Math.min(visualParcel.slot, postBoxSlot - 1),
      standingEmoji: emoji,
      canPassPostBox: false,
    };
  });
}

export function tickVisualParcels(
  visualParcels: readonly VisualParcel[],
  postBoxIsClosed: boolean,
): readonly VisualParcel[] {
  const occupiedSlots = new Set<number>();
  const nextVisualParcels: VisualParcel[] = [];

  for (const visualParcel of [...visualParcels].sort((a, b) => b.slot - a.slot)) {
    const nextVisualParcel = tickVisualParcel(visualParcel, postBoxIsClosed);
    if (nextVisualParcel.slot >= totalSlotCount) continue;

    const placedVisualParcel = placeVisualParcelWithoutCollision(
      visualParcel,
      nextVisualParcel,
      occupiedSlots,
    );

    if (placedVisualParcel === null) continue;

    occupiedSlots.add(placedVisualParcel.slot);
    nextVisualParcels.push(placedVisualParcel);
  }

  return nextVisualParcels;
}

export function getEmojiForStatus(visualParcel: VisualParcel): string {
  switch (visualParcel.status) {
    case "walking":
      return visualParcel.walkingEmoji;
    case "standing":
      return visualParcel.standingEmoji;
    case "exiting":
      return visualParcel.exitEmoji;
  }
}

function createVisualParcel(parcel: Parcel): VisualParcel {
  return {
    parcelId: parcel.stamp.parcelId,
    slot: 0,
    status: "walking",
    walkingEmoji: getParcelEmoji(parcel),
    standingEmoji: getParcelEmoji(parcel),
    exitEmoji: postOfficeStripConfig.sentEmoji,
    canPassPostBox: false,
    waitingSince: parcel.stamp.queuedAt,
  };
}

function placeNewVisualParcelsInWaitingLine(
  visualParcels: readonly VisualParcel[],
  newVisualParcels: readonly VisualParcel[],
): readonly VisualParcel[] {
  const nextWaitingSlot =
    Math.min(0, ...visualParcels.map((visualParcel) => visualParcel.slot)) - 1;

  return [
    ...visualParcels,
    ...newVisualParcels.map((visualParcel, index) => ({
      ...visualParcel,
      slot: nextWaitingSlot - index,
    })),
  ];
}

function getParcelEmoji(parcel: Parcel): string {
  const moodLabel = parcel.stamp.mood ?? null;
  if (moodLabel === null) return postOfficeStripConfig.defaultParcelEmoji;

  return getUserMoodEmoji(moodLabel) ?? postOfficeStripConfig.unknownMoodEmoji;
}

function tickVisualParcel(visualParcel: VisualParcel, postBoxIsClosed: boolean): VisualParcel {
  if (visualParcel.canPassPostBox) {
    return {
      ...visualParcel,
      slot: visualParcel.slot + 1,
      status: visualParcel.slot + 1 >= postBoxSlot ? "exiting" : "walking",
    };
  }

  if (visualParcel.slot >= postBoxSlot - 1 || postBoxIsClosed) {
    return {
      ...visualParcel,
      status: "standing",
      standingEmoji: postBoxIsClosed ? getWaitingEmoji(visualParcel) : visualParcel.standingEmoji,
    };
  }

  return {
    ...visualParcel,
    slot: visualParcel.slot + 1,
    status: "walking",
  };
}

function placeVisualParcelWithoutCollision(
  currentVisualParcel: VisualParcel,
  nextVisualParcel: VisualParcel,
  occupiedSlots: ReadonlySet<number>,
): VisualParcel | null {
  if (!occupiedSlots.has(nextVisualParcel.slot)) return nextVisualParcel;

  if (!occupiedSlots.has(currentVisualParcel.slot)) {
    return { ...currentVisualParcel, status: "standing" };
  }

  return null;
}

function getWaitingEmoji(visualParcel: VisualParcel): string {
  const waitedMs = Date.now() - new Date(visualParcel.waitingSince).getTime();
  const waitingStage = [...postOfficeStripConfig.waitingStages]
    .reverse()
    .find((stage) => waitedMs >= stage.afterMs);

  return waitingStage?.emoji ?? visualParcel.standingEmoji;
}
