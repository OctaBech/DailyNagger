import { StyleSheet, View } from "react-native";
import { nagPlanTheme } from "@/features/nag-plan/theme";

type FocusFrameProps = {
  readonly radius?: number;
};

export const FocusFrame = ({ radius = nagPlanTheme.radius.focusFrame }: FocusFrameProps) => {
  return <View pointerEvents="none" style={[styles.focusFrame, { borderRadius: radius }]} />;
};

const styles = StyleSheet.create({
  focusFrame: {
    borderColor: nagPlanTheme.selection.focusBorder,
    borderWidth: 1,
    bottom: 1,
    left: 1,
    position: "absolute",
    right: 1,
    top: 1,
  },
});
