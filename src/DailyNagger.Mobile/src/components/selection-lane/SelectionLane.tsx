import { Pressable, StyleSheet, View } from "react-native";
import { nagPlanTheme } from "@/features/nag-plan/theme";

type SelectionLaneProps = {
  readonly accessibilityLabel: string;
  readonly markerHeight?: number;
  readonly onPress?: () => void;
  readonly tone?: "active" | "activeSoft" | "completed" | "completedSoft" | "neutral";
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
    case "activeSoft":
      return nagPlanTheme.rail.activeSoft;
    case "completed":
      return nagPlanTheme.rail.completed;
    case "completedSoft":
      return nagPlanTheme.rail.completedSoft;
    case "neutral":
      return nagPlanTheme.rail.neutral;
  }
}

const styles = StyleSheet.create({
  lane: {
    alignItems: "flex-start",
    justifyContent: "center",
    alignSelf: "stretch",
    paddingLeft: 2,
    width: nagPlanTheme.selectionLane.width,
  },
  rail: {
    width: nagPlanTheme.selectionLane.railWidth,
  },
  fullHeightRail: {
    flex: 1,
  },
});
