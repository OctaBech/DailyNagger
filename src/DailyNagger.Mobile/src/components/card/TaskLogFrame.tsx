import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { nagPlanTheme } from "@/features/nag-plan/theme";
import { FocusFrame } from "./FocusFrame";

type TaskLogFrameProps = {
  readonly children: ReactNode;
  readonly hasFocus?: boolean;
  readonly isCompleted?: boolean;
  readonly isSelected?: boolean;
};

export const TaskLogFrame = ({
  children,
  hasFocus = false,
  isCompleted = false,
  isSelected = false,
}: TaskLogFrameProps) => {
  return (
    <View
      style={[styles.card, isCompleted && styles.completedCard, isSelected && styles.selectedCard]}
    >
      {children}
      {hasFocus ? <FocusFrame radius={nagPlanTheme.radius.card} /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: nagPlanTheme.taskLog.background,
    borderColor: nagPlanTheme.taskLog.border,
    borderRadius: nagPlanTheme.radius.card,
    borderWidth: 1,
    gap: nagPlanTheme.cardDensity.fieldGap,
    padding: nagPlanTheme.cardDensity.padding,
    position: "relative",
  },
  completedCard: {
    backgroundColor: nagPlanTheme.taskLog.completedBackground,
    borderColor: nagPlanTheme.taskLog.completedBorder,
  },
  selectedCard: {
    borderColor: nagPlanTheme.selection.border,
    shadowColor: nagPlanTheme.selection.shadow,
    shadowOffset: { width: -3, height: 4 },
    shadowOpacity: 0.34,
    shadowRadius: 3,
  },
});
