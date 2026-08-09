import { postOfficeStripConfig } from "@/config";
import { userMoodOptions } from "@/models";
import type { Parcel, SendingEventType } from "@/services";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { EventEmitter, Guid } from "@/shared";

type PostOfficeStripProps = {
  readonly sendingEvents: EventEmitter<SendingEventType, readonly Parcel[]>;
  readonly bottomOffset?: number;
};

type VisualParcel = {
  readonly parcelId: Guid;
  readonly slot: number;
  readonly status: VisualParcelStatus;
  readonly walkingEmoji: string;
  readonly standingEmoji: string;
  readonly exitEmoji: string;
  readonly canPassPostBox: boolean;
  readonly waitingSince: string;
};

type VisualParcelStatus = "walking" | "standing" | "exiting";

type PostOfficeStripState = {
  readonly visualParcels: readonly VisualParcel[];
  readonly postBoxIsClosed: boolean;
};

const postBoxSlot = postOfficeStripConfig.queueSlotCount;
const totalSlotCount = postOfficeStripConfig.queueSlotCount + postOfficeStripConfig.exitSlotCount + 1;
const slotWidth = postOfficeStripConfig.stripWidth / totalSlotCount;

export const PostOfficeStrip = (props: PostOfficeStripProps) => {
  const { visualParcels, postBoxIsClosed } = usePostOfficeStrip(props.sendingEvents);

  if (visualParcels.length === 0) return <></>;

  return (
    <View style={[styles.container, { bottom: props.bottomOffset ?? 16 }]}>
      {Array.from({ length: totalSlotCount }, (_, slot) =>
        renderSlot(slot, visualParcels, postBoxIsClosed),
      )}
    </View>
  );
};

function usePostOfficeStrip(
  sendingEvents: EventEmitter<SendingEventType, readonly Parcel[]>,
): PostOfficeStripState {
  const [state, setState] = useState<PostOfficeStripState>({
    visualParcels: [],
    postBoxIsClosed: false,
  });

  useEffect(() => {
    return sendingEvents.subscribe((eventType, parcels) => {
      setState((currentState) => handleSendingEvent(eventType, parcels, currentState));
    });
  }, [sendingEvents]);

  useEffect(() => {
    const timer = setInterval(() => {
      setState((currentState) => ({
        ...currentState,
        visualParcels: tickVisualParcels(
          currentState.visualParcels,
          currentState.postBoxIsClosed,
        ),
      }));
    }, postOfficeStripConfig.tickMs);

    return () => clearInterval(timer);
  }, []);

  return state;
}

function handleSendingEvent(
  eventType: SendingEventType,
  parcels: readonly Parcel[],
  state: PostOfficeStripState,
): PostOfficeStripState {
  switch (eventType) {
    case "parcel-queued":
      return { ...state, visualParcels: addQueuedParcels(state.visualParcels, parcels) };
    case "parcel-coalesced":
      return { ...state, visualParcels: markCoalescedParcel(state.visualParcels, parcels) };
    case "batch-sent":
      return {
        ...state,
        visualParcels: markBatchResult(state.visualParcels, parcels, postOfficeStripConfig.sentEmoji),
        postBoxIsClosed: false,
      };
    case "batch-rejected-current-version":
      return {
        ...state,
        visualParcels: markBatchWaitingForUserDecision(
          state.visualParcels,
          parcels,
          postOfficeStripConfig.rejectedEmoji,
        ),
      };
    case "batch-rejected-unrepairable":
      return {
        ...state,
        visualParcels: markBatchWaitingForUserDecision(
          state.visualParcels,
          parcels,
          postOfficeStripConfig.rejectedEmoji,
        ),
      };
    case "batch-failed-to-connect":
      return {
        ...state,
        visualParcels: markBatchWaitingAtPostBox(state.visualParcels, parcels),
        postBoxIsClosed: true,
      };
    case "batch-forced":
      return {
        ...state,
        visualParcels: markBatchResult(
          state.visualParcels,
          parcels,
          postOfficeStripConfig.forcedEmoji,
        ),
      };
    case "batch-discarded":
      return {
        ...state,
        visualParcels: markBatchResult(
          state.visualParcels,
          parcels,
          postOfficeStripConfig.discardedEmoji,
        ),
      };
  }
}

function addQueuedParcels(
  visualParcels: readonly VisualParcel[],
  parcels: readonly Parcel[],
): readonly VisualParcel[] {
  const knownParcelIds = new Set(visualParcels.map((visualParcel) => visualParcel.parcelId));
  const newVisualParcels = parcels
    .filter((parcel) => !knownParcelIds.has(parcel.stamp.parcelId))
    .map((parcel) => createVisualParcel(parcel));

  return placeNewVisualParcelsInWaitingLine(visualParcels, newVisualParcels);
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
  const nextWaitingSlot = Math.min(0, ...visualParcels.map((visualParcel) => visualParcel.slot)) - 1;

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

  return (
    userMoodOptions.find((option) => option.label === moodLabel)?.emoji ??
    postOfficeStripConfig.unknownMoodEmoji
  );
}

function markCoalescedParcel(
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

function markBatchResult(
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

function markBatchWaitingAtPostBox(
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

function markBatchWaitingForUserDecision(
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

function tickVisualParcels(
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

function tickVisualParcel(
  visualParcel: VisualParcel,
  postBoxIsClosed: boolean,
): VisualParcel {
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

function renderSlot(
  slot: number,
  visualParcels: readonly VisualParcel[],
  isPostBoxBlocked: boolean,
) {
  const visualParcel = visualParcels.find((parcel) => parcel.slot === slot);

  return (
    <View key={slot} style={styles.slot}>
      {slot === postBoxSlot && renderPostBox(isPostBoxBlocked)}
      {renderVisualParcel(slot, visualParcel, isPostBoxBlocked)}
    </View>
  );
}

function renderPostBox(isPostBoxBlocked: boolean) {
  return (
    <View style={styles.postBox}>
      <Text style={styles.postBoxSymbol}>
        {isPostBoxBlocked
          ? postOfficeStripConfig.blockedPostBoxEmoji
          : postOfficeStripConfig.postBoxEmoji}
      </Text>
    </View>
  );
}

function renderVisualParcel(
  slot: number,
  visualParcel: VisualParcel | undefined,
  postBoxIsClosed: boolean,
) {
  if (visualParcel === undefined) return <></>;

  return (
    <View style={styles.parcelSymbol}>
      <Text style={styles.symbol}>{getEmojiForStatus(visualParcel)}</Text>
    </View>
  );
}

function getEmojiForStatus(visualParcel: VisualParcel): string {
  switch (visualParcel.status) {
    case "walking":
      return visualParcel.walkingEmoji;
    case "standing":
      return visualParcel.standingEmoji;
    case "exiting":
      return visualParcel.exitEmoji;
  }
}

function getWaitingEmoji(visualParcel: VisualParcel): string {
  const waitedMs = Date.now() - new Date(visualParcel.waitingSince).getTime();
  const waitingStage = [...postOfficeStripConfig.waitingStages]
    .reverse()
    .find((stage) => waitedMs >= stage.afterMs);

  return waitingStage?.emoji ?? visualParcel.standingEmoji;
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#24282a",
    borderColor: "#3c4245",
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 34,
    paddingHorizontal: 8,
    paddingVertical: 4,
    position: "absolute",
    shadowColor: "#060708",
    shadowOffset: { width: -2, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
    width: postOfficeStripConfig.stripWidth,
  },
  slot: {
    alignItems: "center",
    height: 24,
    justifyContent: "center",
    width: slotWidth,
  },
  symbol: {
    fontSize: 16,
    userSelect: "none",
  },
  parcelSymbol: {
    alignItems: "center",
    height: 24,
    justifyContent: "center",
    position: "relative",
    width: 24,
    zIndex: 1,
  },
  resultSymbol: {
    fontSize: 14,
    position: "absolute",
    right: -4,
    top: 1,
    userSelect: "none",
  },
  postBox: {
    alignItems: "center",
    height: 24,
    justifyContent: "center",
    position: "absolute",
    width: 24,
    zIndex: 0,
  },
  postBoxSymbol: {
    fontSize: 18,
    opacity: 0.62,
    userSelect: "none",
  },
});
