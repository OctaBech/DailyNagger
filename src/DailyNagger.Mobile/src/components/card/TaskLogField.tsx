import { Pressable, StyleSheet } from "react-native";
import { nagPlanTheme } from "@/features/nag-plan/theme";

type TaskLogFieldProps = {
  readonly onFocus?: () => void;
};

export const TaskLogField = ({ onFocus }: TaskLogFieldProps) => {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Select task log"
      onPress={onFocus}
      style={({ pressed }) => [styles.field, pressed && styles.pressedArea]}
    />
  );
};

const styles = StyleSheet.create({
  field: {
    minHeight: 8,
  },
  pressedArea: {
    backgroundColor: nagPlanTheme.taskItem.pressedBackground,
  },
});
