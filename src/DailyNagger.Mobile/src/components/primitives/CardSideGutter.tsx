import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { nagPlanTheme } from "@/features/nag-plan/theme";

type CardSideGutterProps = {
  readonly children?: ReactNode;
  readonly size?: "full" | "half";
};

export const CardSideGutter = ({ children, size = "full" }: CardSideGutterProps) => {
  return <View style={size === "half" ? styles.half : styles.full}>{children}</View>;
};

const styles = StyleSheet.create({
  full: {
    width: nagPlanTheme.gutter.cardSide,
  },
  half: {
    width: nagPlanTheme.gutter.cardSideHalf,
  },
});
