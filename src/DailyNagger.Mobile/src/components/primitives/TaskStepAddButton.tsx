import { StyleSheet } from "react-native";
import { FAB } from "react-native-paper";
import { actionButtonTheme } from "./actionButtonTheme";

type TaskStepAddButtonProps = {
  readonly isDisabled?: boolean;
  readonly onPress: () => void;
};

export const TaskStepAddButton = ({ isDisabled = false, onPress }: TaskStepAddButtonProps) => {
  return (
    <FAB
      accessibilityLabel="Add task step"
      color={isDisabled ? "#7f878b" : actionButtonTheme.icon}
      disabled={isDisabled}
      icon="checkbox-marked-circle-plus-outline"
      onPress={onPress}
      size="small"
      style={[styles.button, isDisabled && styles.disabledButton]}
    />
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: actionButtonTheme.background,
  },
  disabledButton: {
    backgroundColor: "#d8dddd",
    elevation: 0,
    shadowOpacity: 0,
  },
});
