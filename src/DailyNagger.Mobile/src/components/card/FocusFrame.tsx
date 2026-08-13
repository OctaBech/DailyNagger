import { StyleSheet, View } from "react-native";
import { nagPlanTheme } from "@/features/nag-plan/theme";

type FocusFrameProps = {
  readonly color?: string;
  readonly radius?: number;
};

export const FocusFrame = ({
  color = nagPlanTheme.selection.focusBorder,
  radius = nagPlanTheme.radius.focusFrame,
}: FocusFrameProps) => {
  return (
    <View
      pointerEvents="none"
      style={[styles.focusRail, { backgroundColor: color, borderRadius: Math.min(radius, 1) }]}
    />
  );
};

const styles = StyleSheet.create({
  focusRail: {
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0,
    width: nagPlanTheme.rail.focusLaneWidth,
    zIndex: 3,
  },
});
