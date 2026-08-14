import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { nagPlanTheme } from "@/features/nag-plan/theme";
import { SelectionLane } from "@/components/selection-lane";

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
  const markerHeight = nagPlanTheme.rail.entryMarkerNeutralHeight;

  return (
    <View
      style={[
        styles.card,
        isRemovedOnRollover && styles.removedOnRolloverCard,
        isSelected && styles.selectedCard,
      ]}
    >
      <SelectionLane
        accessibilityLabel="Select task entry"
        onPress={onMarkerPress}
        markerHeight={markerHeight}
        tone={hasFocus ? railTone : "neutral"}
      />
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
});
