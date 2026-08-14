import { Pressable, StyleSheet, View } from "react-native";
import { nagPlanTheme } from "@/features/nag-plan/theme";

type SelectionLaneProps = {
  readonly accessibilityLabel: string;
  readonly markerHeight?: number;
  readonly onPress?: () => void;
  readonly tone?: "active" | "completed" | "neutral";
};

export const SelectionLane = ({
  accessibilityLabel,
  markerHeight,
  onPress,
  tone = "neutral",
}: SelectionLaneProps) => {
  const railColor = getRailColor(tone);
  const railShape = markerHeight === undefined ? styles.fullHeightRail : { height: markerHeight };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={styles.lane}
    >
      <View
        style={[
          styles.rail,
          railShape,
          {
            backgroundColor: railColor,
          },
        ]}
      />
    </Pressable>
  );
};

function getRailColor(tone: NonNullable<SelectionLaneProps["tone"]>): string {
  switch (tone) {
    case "active":
      return nagPlanTheme.rail.active;
    case "completed":
      return nagPlanTheme.rail.completed;
    case "neutral":
      return nagPlanTheme.rail.neutral;
  }
}

const styles = StyleSheet.create({
  lane: {
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
    width: nagPlanTheme.selectionLane.width,
  },
  rail: {
    width: nagPlanTheme.selectionLane.railWidth,
  },
  fullHeightRail: {
    flex: 1,
  },
});
