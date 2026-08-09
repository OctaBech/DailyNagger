import { Pressable, StyleSheet, Text, View } from "react-native";
import type { TaskLog } from "@/models";
import { nagPlanTheme } from "@/features/nag-plan/theme";
import * as Primitives from "@/components/primitives";

type TaskLogFieldProps = {
  readonly taskLog: TaskLog;
  readonly allowEditTag?: boolean;
  readonly isTagPickerOpen?: boolean;
  readonly showComponentOutlines?: boolean;
  readonly onFocus?: () => void;
  readonly onPressTag?: () => void;
};

export const TaskLogField = ({
  taskLog,
  allowEditTag = false,
  isTagPickerOpen = false,
  showComponentOutlines = false,
  onFocus,
  onPressTag,
}: TaskLogFieldProps) => {
  const shouldShowTag = taskLog.tag !== null || showComponentOutlines;
  const tagText = taskLog.tag ?? "tag";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Select task log"
      onPress={onFocus}
      style={({ pressed }) => [styles.field, pressed && styles.pressedArea]}
    >
      <View style={styles.titleArea}>
        <Text selectable={false} style={styles.title}>
          TaskLog
        </Text>
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
    justifyContent: "space-between",
  },
  title: {
    color: nagPlanTheme.taskItem.titleText,
    fontSize: 14,
    fontWeight: "900",
  },
  titleArea: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 4,
  },
  pressedArea: {
    backgroundColor: nagPlanTheme.taskItem.pressedBackground,
  },
});
