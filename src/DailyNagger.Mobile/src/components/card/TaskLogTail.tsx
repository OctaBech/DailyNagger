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
  readonly onPressTag?: () => void;
};

export const TaskLogTail = ({
  taskLog,
  allowEditTag = false,
  isTagPickerOpen = false,
  showComponentOutlines = false,
  onFocus,
  onPressTag,
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
    </Pressable>
  );
};

const styles = StyleSheet.create({
  field: {
    alignItems: "center",
    flexDirection: "row",
    alignSelf: "stretch",
    minHeight: 48,
  },
  metaArea: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  pressedArea: {
    backgroundColor: nagPlanTheme.taskItem.pressedBackground,
  },
});
