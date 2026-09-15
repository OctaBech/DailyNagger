import { postOfficeStripConfig } from "@/config";
import type { ParcelFlowEvents } from "@/services";
import { Text, View } from "react-native";
import type { VisualParcel } from "./postOfficeStripModel";
import { postBoxSlot, totalSlotCount, getEmojiForStatus } from "./postOfficeVisualParcel";
import { postOfficeStripStyles as styles } from "./postOfficeStripStyles";
import { usePostOfficeStrip } from "./usePostOfficeStrip";

type PostOfficeStripProps = {
  readonly sendingEvents: ParcelFlowEvents;
  readonly bottomOffset?: number;
};

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

function renderSlot(
  slot: number,
  visualParcels: readonly VisualParcel[],
  isPostBoxBlocked: boolean,
) {
  const visualParcel = visualParcels.find((parcel) => parcel.slot === slot);

  return (
    <View key={slot} style={styles.slot}>
      {slot === postBoxSlot && renderPostBox(isPostBoxBlocked)}
      {renderVisualParcel(visualParcel)}
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

function renderVisualParcel(visualParcel: VisualParcel | undefined) {
  if (visualParcel === undefined) return <></>;

  return (
    <View style={styles.parcelSymbol}>
      <Text style={styles.symbol}>{getEmojiForStatus(visualParcel)}</Text>
    </View>
  );
}
