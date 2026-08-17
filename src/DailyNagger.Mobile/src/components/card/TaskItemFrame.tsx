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
    paddingBottom: nagPlanTheme.cardDensity.taskItemPadding,
    paddingLeft: nagPlanTheme.rail.contentGap,
    paddingRight: nagPlanTheme.cardDensity.taskItemPadding,
    paddingTop: nagPlanTheme.cardDensity.taskItemPadding,
  },
});
