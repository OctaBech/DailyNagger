import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Primitives from "@/components/primitives";
import { nagPlanTheme } from "@/features/nag-plan/theme";
import type { TaskLog } from "@/models";

type TaskLogTailProps = {
  readonly taskLog: TaskLog;
  readonly allowEditTag?: boolean;
  readonly isTagPickerOpen?: boolean;
  readonly showComponentOutlines?: boolean;
  readonly onAddTaskItem?: () => void;
  readonly onFocus?: () => void;
  readonly onPressTag?: () => void;
};

export const TaskLogTail = ({
  taskLog,
  allowEditTag = false,
  isTagPickerOpen = false,
  showComponentOutlines = false,
  onAddTaskItem,
  onFocus,
  onPressTag,
}: TaskLogTailProps) => {
  const shouldShowTag = taskLog.tag !== null || showComponentOutlines;
  const tagText = taskLog.tag ?? "tag";

  return (
    <View style={styles.tail}>
      <View style={styles.actions}>
        {onAddTaskItem !== undefined && (
          <TailButton
            accessibilityLabel="Add task step to task log"
            onPress={() => {
              onFocus?.();
              onAddTaskItem();
            }}
          >
            <Text selectable={false} style={styles.plus}>
              +
            </Text>
            <Text selectable={false} style={styles.checkGlyph}>
              ✔
            </Text>
          </TailButton>
        )}
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
      <Primitives.RowRemainderPressable accessibilityLabel="Select task log" onPress={onFocus} />
    </View>
  );
};

type TailButtonProps = {
  readonly accessibilityLabel: string;
  readonly children: ReactNode;
  readonly onPress: () => void;
};

const TailButton = ({ accessibilityLabel, children, onPress }: TailButtonProps) => {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressedButton]}
    >
      {children}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  actions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  button: {
    alignItems: "center",
    backgroundColor: nagPlanTheme.taskLog.background,
    borderColor: nagPlanTheme.selection.border,
    borderRadius: nagPlanTheme.radius.control,
    borderWidth: 1,
    flexDirection: "row",
    gap: 2,
    height: 28,
    justifyContent: "center",
    minWidth: 32,
    paddingHorizontal: 5,
  },
  checkGlyph: {
    color: nagPlanTheme.taskItem.chevronText,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 16,
  },
  plus: {
    color: nagPlanTheme.taskItem.chevronText,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 16,
  },
  pressedButton: {
    backgroundColor: nagPlanTheme.taskItem.pressedBackground,
  },
  tail: {
    alignItems: "flex-end",
    flexDirection: "row",
    minHeight: 38,
    paddingBottom: 5,
    paddingTop: 5,
  },
});
