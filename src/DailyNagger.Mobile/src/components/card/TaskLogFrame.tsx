import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { nagPlanTheme } from "@/features/nag-plan/theme";

type TaskLogFrameProps = {
  readonly children: ReactNode;
  readonly isSelected?: boolean;
};

export const TaskLogFrame = ({ children, isSelected = false }: TaskLogFrameProps) => {
  return (
    <View style={[styles.card, isSelected && styles.selectedCard]}>
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: nagPlanTheme.taskLog.background,
    flexDirection: "row",
    overflow: "hidden",
    position: "relative",
  },
  content: {
    flex: 1,
  },
  selectedCard: {
    backgroundColor: nagPlanTheme.taskLog.background,
  },
});
