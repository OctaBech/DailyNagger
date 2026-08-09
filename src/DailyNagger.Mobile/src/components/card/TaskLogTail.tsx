import { Pressable, StyleSheet, View } from "react-native";
import * as Primitives from "@/components/primitives";
import { nagPlanTheme } from "@/features/nag-plan/theme";

type TaskLogTailProps = {
  readonly onFocus?: () => void;
  readonly isTaskStepAddDisabled?: boolean;
  readonly onPressAddTaskStep?: () => void;
};

export const TaskLogTail = ({
  onFocus,
  isTaskStepAddDisabled = false,
  onPressAddTaskStep,
}: TaskLogTailProps) => {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Select task log"
      onPress={onFocus}
      style={({ pressed }) => [styles.field, pressed && styles.pressedArea]}
    >
      <View style={styles.actionsArea}>
        <Primitives.TaskStepAddButton
          isDisabled={isTaskStepAddDisabled}
          onPress={() => {
            onFocus?.();
            onPressAddTaskStep?.();
          }}
        />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignSelf: "stretch",
  },
  actionsArea: {
    flexDirection: "row",
    gap: 8,
  },
  pressedArea: {
    backgroundColor: nagPlanTheme.taskItem.pressedBackground,
  },
});
