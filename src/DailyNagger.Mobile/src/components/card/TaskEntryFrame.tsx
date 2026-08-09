import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { nagPlanTheme } from "@/features/nag-plan/theme";
import { FocusFrame } from "./FocusFrame";

type TaskEntryFrameProps = {
  readonly children: ReactNode;
  readonly hasFocus?: boolean;
  readonly isSelected?: boolean;
  readonly isRemovedOnRollover?: boolean;
};

export const TaskEntryFrame = ({
  children,
  hasFocus = false,
  isSelected = false,
  isRemovedOnRollover = false,
}: TaskEntryFrameProps) => {
  return (
    <View
      style={[
        styles.card,
        isRemovedOnRollover && styles.removedOnRolloverCard,
        isSelected && styles.selectedCard,
      ]}
    >
      {children}
      {hasFocus ? <FocusFrame radius={nagPlanTheme.radius.control} /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderColor: nagPlanTheme.taskItem.background,
    borderRadius: nagPlanTheme.radius.control,
    borderWidth: 1,
    position: "relative",
  },
  removedOnRolloverCard: {
    backgroundColor: nagPlanTheme.taskItem.removedOnRolloverBackground,
    borderColor: nagPlanTheme.taskItem.removedOnRolloverBorder,
  },
  selectedCard: {
    borderColor: nagPlanTheme.selection.border,
  },
});
