import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import * as Primitives from "@/components/primitives";
import { nagPlanTheme } from "@/features/nag-plan/theme";
import { SelectionLane } from "@/components/selection-lane";

type TaskLogFrameProps = {
  readonly children: ReactNode;
  readonly hasFocus?: boolean;
  readonly parentNaggerHasFocus?: boolean;
  readonly isSelected?: boolean;
  readonly onRailPress?: () => void;
  readonly onPressAddTaskStep?: () => void;
  readonly railTone?: "active" | "completed";
};

export const TaskLogFrame = ({
  children,
  hasFocus = false,
  parentNaggerHasFocus = false,
  isSelected = false,
  onRailPress,
  onPressAddTaskStep,
  railTone = "active",
}: TaskLogFrameProps) => {
  const hasActiveRail = hasFocus || parentNaggerHasFocus;

  return (
    <View style={[styles.card, isSelected && styles.selectedCard]}>
      <View style={styles.laneArea}>
        <SelectionLane
          accessibilityLabel="Select task log"
          onPress={onRailPress}
          tone={hasActiveRail ? railTone : "neutral"}
        />
      </View>
      <View style={styles.content}>{children}</View>
      {onPressAddTaskStep !== undefined && (
        <View style={styles.laneAction}>
          <Primitives.TaskStepAddButton onPress={onPressAddTaskStep} />
        </View>
      )}
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
  laneAction: {
    alignItems: "center",
    bottom: 10,
    left: 0,
    position: "absolute",
    width: 56,
  },
  laneArea: {
    alignSelf: "stretch",
    position: "relative",
    width: nagPlanTheme.selectionLane.width,
  },
  selectedCard: {
    backgroundColor: nagPlanTheme.taskLog.background,
  },
});
