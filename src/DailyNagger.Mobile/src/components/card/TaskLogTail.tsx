import { Pressable, StyleSheet, View } from "react-native";
import * as Primitives from "@/components/primitives";
import { nagPlanTheme } from "@/features/nag-plan/theme";
import type { TaskLog } from "@/models";

type TaskLogTailProps = {
  readonly taskLog: TaskLog;
  readonly allowEditTag?: boolean;
  readonly isTagPickerOpen?: boolean;
  readonly showComponentOutlines?: boolean;
  readonly onFocus?: () => void;
  readonly isTaskStepAddDisabled?: boolean;
  readonly onPressTag?: () => void;
  readonly onPressAddTaskStep?: () => void;
};

export const TaskLogTail = ({
  taskLog,
  allowEditTag = false,
  isTagPickerOpen = false,
  showComponentOutlines = false,
  onFocus,
  isTaskStepAddDisabled = false,
  onPressTag,
  onPressAddTaskStep,
}: TaskLogTailProps) => {
  const shouldShowTag = taskLog.tag !== null || showComponentOutlines;
  const tagText = taskLog.tag ?? "tag";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Select task log"
      onPress={onFocus}
      style={({ pressed }) => [styles.field, pressed && styles.pressedArea]}
    >
      <View style={styles.metaArea}>
        {shouldShowTag && (
          <Primitives.PillButton
            label={tagText}
            isEmpty={taskLog.tag === null}
            showOutline={showComponentOutlines}
            isActive={isTagPickerOpen}
            onPress={() => {
              onFocus?.();
              if (allowEditTag) onPressTag?.();
            }}
          />
        )}
      </View>
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
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    alignSelf: "stretch",
    minHeight: 32,
  },
  metaArea: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  actionsArea: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  pressedArea: {
    backgroundColor: nagPlanTheme.taskItem.pressedBackground,
  },
});
