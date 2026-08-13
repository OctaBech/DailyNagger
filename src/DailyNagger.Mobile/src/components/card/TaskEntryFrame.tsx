import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { nagPlanTheme } from "@/features/nag-plan/theme";

type TaskEntryFrameProps = {
  readonly children: ReactNode;
  readonly hasFocus?: boolean;
  readonly isSelected?: boolean;
  readonly isRemovedOnRollover?: boolean;
  readonly onMarkerPress?: () => void;
  readonly railTone?: "active" | "completed";
};

export const TaskEntryFrame = ({
  children,
  hasFocus = false,
  isSelected = false,
  isRemovedOnRollover = false,
  onMarkerPress,
  railTone = "active",
}: TaskEntryFrameProps) => {
  const focusMarkerColor =
    railTone === "completed" ? nagPlanTheme.rail.completed : nagPlanTheme.rail.active;

  return (
    <View
      style={[
        styles.card,
        isRemovedOnRollover && styles.removedOnRolloverCard,
        isSelected && styles.selectedCard,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Select task entry"
        onPress={onMarkerPress}
        style={styles.markerLane}
      >
        <View
          style={[
            styles.marker,
            hasFocus ? [styles.focusMarker, { backgroundColor: focusMarkerColor }] : styles.neutralMarker,
          ]}
        />
      </Pressable>
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderColor: "transparent",
    borderRadius: nagPlanTheme.radius.control,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    flexDirection: "row",
    gap: nagPlanTheme.rail.contentGap,
    overflow: "hidden",
  },
  content: {
    flex: 1,
  },
  removedOnRolloverCard: {
    backgroundColor: nagPlanTheme.taskItem.removedOnRolloverBackground,
    borderColor: "transparent",
  },
  selectedCard: {
    borderColor: "transparent",
  },
  markerLane: {
    alignItems: "center",
    justifyContent: "center",
    width: nagPlanTheme.rail.focusLaneWidth,
  },
  marker: {
    backgroundColor: nagPlanTheme.rail.neutral,
    width: nagPlanTheme.rail.focusLaneWidth,
  },
  focusMarker: {
    height: nagPlanTheme.rail.entryMarkerHeight,
  },
  neutralMarker: {
    height: nagPlanTheme.rail.entryMarkerNeutralHeight,
  },
});
