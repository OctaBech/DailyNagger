import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { nagPlanTheme } from "@/features/nag-plan/theme";

type TaskLogFrameProps = {
  readonly children: ReactNode;
  readonly hasFocus?: boolean;
  readonly parentNaggerHasFocus?: boolean;
  readonly isCompleted?: boolean;
  readonly isSelected?: boolean;
  readonly onRailPress?: () => void;
  readonly railTone?: "active" | "completed";
};

export const TaskLogFrame = ({
  children,
  hasFocus = false,
  parentNaggerHasFocus = false,
  isCompleted = false,
  isSelected = false,
  onRailPress,
  railTone = "active",
}: TaskLogFrameProps) => {
  const hasActiveRail = hasFocus || parentNaggerHasFocus;
  const railColor = railTone === "completed" ? nagPlanTheme.rail.completed : nagPlanTheme.rail.active;

  return (
    <View style={[styles.card, isCompleted && styles.completedCard, isSelected && styles.selectedCard]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Select task log"
        onPress={onRailPress}
        style={[
          styles.railLane,
          { backgroundColor: hasActiveRail ? railColor : nagPlanTheme.rail.neutral },
        ]}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: nagPlanTheme.taskLog.background,
    borderTopColor: nagPlanTheme.taskLog.foldBorder,
    borderTopWidth: 1,
    flexDirection: "row",
    overflow: "hidden",
    position: "relative",
  },
  content: {
    flex: 1,
    gap: nagPlanTheme.cardDensity.fieldGap,
    paddingBottom: nagPlanTheme.cardDensity.taskLogPadding,
    paddingRight: nagPlanTheme.cardDensity.taskLogPadding,
    paddingTop: nagPlanTheme.cardDensity.taskLogPadding,
  },
  railLane: {
    width: nagPlanTheme.rail.focusLaneWidth,
  },
  completedCard: {
    backgroundColor: nagPlanTheme.taskLog.completedBackground,
  },
  selectedCard: {
    backgroundColor: nagPlanTheme.taskLog.background,
  },
});
