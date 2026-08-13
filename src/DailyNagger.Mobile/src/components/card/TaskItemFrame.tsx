import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { nagPlanTheme } from "@/features/nag-plan/theme";

type TaskItemFrameProps = {
  readonly children: ReactNode;
};

export const TaskItemFrame = ({ children }: TaskItemFrameProps) => {
  return <View style={styles.frame}>{children}</View>;
};

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    padding: nagPlanTheme.cardDensity.taskItemPadding,
  },
});
