import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Icon } from "react-native-paper";
import type { TaskItem } from "@/models";
import { nagPlanTheme } from "@/features/nag-plan/theme";
import * as Input from "@/components/input";
import * as Primitives from "@/components/primitives";
import { cardRowLayout } from "./cardRowLayout";

type TaskItemFieldProps = {
  readonly taskItem: TaskItem;
  readonly hasChildren: boolean;
  readonly isExpanded: boolean;
  readonly allowEditName?: boolean;
  readonly allowEditTag?: boolean;
  readonly isTagPickerOpen?: boolean;
  readonly showTag?: boolean;
  readonly showComponentOutlines?: boolean;
  readonly muteCheckmark?: boolean;
  readonly checkmarkShape?: "circle" | "square";
  readonly forceExpandableIndicator?: boolean;
  readonly onFocus?: () => void;
  readonly onNameFocus?: () => void;
  readonly onNameCommit?: (name: string) => void;
  readonly onDonePress?: () => void;
  readonly onDeletePress?: () => void;
  readonly onExpandPress: () => void;
  readonly onPressTag?: () => void;
};

export const TaskItemField = ({
  taskItem,
  hasChildren,
  isExpanded,
  allowEditName = false,
  allowEditTag = false,
  isTagPickerOpen = false,
  showTag = true,
  showComponentOutlines = false,
  muteCheckmark = false,
  checkmarkShape = "square",
  forceExpandableIndicator = false,
  onFocus,
  onNameFocus,
  onNameCommit,
  onDonePress,
  onDeletePress,
  onExpandPress,
  onPressTag,
}: TaskItemFieldProps) => {
  const [isDeleteArmed, setIsDeleteArmed] = useState(false);
  const shouldShowTag = showTag && (taskItem.tag !== null || showComponentOutlines);
  const tagText = taskItem.tag ?? "tag";

  useEffect(() => {
    if (taskItem.clientProps.hasFocus) return undefined;

    const frame = requestAnimationFrame(() => setIsDeleteArmed(false));

    return () => cancelAnimationFrame(frame);
  }, [taskItem.clientProps.hasFocus]);

  function focusAndRun(action?: () => void) {
    setIsDeleteArmed(false);
    onFocus?.();
    action?.();
  }

  return (
    <View style={styles.field}>
      <Primitives.TaskItemCheckmark
        checked={taskItem.isDone}
        shape={checkmarkShape}
        isMuted={muteCheckmark}
        onPress={() => focusAndRun(onDonePress)}
      />

      {allowEditName ? (
        <Input.CommitTextInput
          mode="title"
          value={taskItem.name}
          onCommit={(name) => onNameCommit?.(name)}
          onFocus={() => {
            setIsDeleteArmed(false);
            onNameFocus?.();
          }}
          onTouchStart={() => focusAndRun()}
          showEditFrame={showComponentOutlines}
          style={[cardRowLayout.textInput, styles.titleControl, styles.titleInput]}
        />
      ) : (
        <Pressable
          onPress={() => focusAndRun(onExpandPress)}
          style={[cardRowLayout.textSlot, styles.titleControl]}
        >
          <Text selectable={false} style={[cardRowLayout.text, styles.title]}>
            {taskItem.name}
          </Text>
        </Pressable>
      )}

      {shouldShowTag && (
        <Primitives.PillButton
          label={tagText}
          isEmpty={taskItem.tag === null}
          showOutline={showComponentOutlines}
          isActive={isTagPickerOpen}
          onPress={() => {
            onFocus?.();
            if (allowEditTag) onPressTag?.();
          }}
        />
      )}

      {onDeletePress ? (
        isDeleteArmed ? (
          <View style={styles.deleteConfirmArea}>
            <ConfirmDeleteButton
              accessibilityLabel="Cancel delete task step"
              icon="undo-variant"
              onPress={() => {
                onFocus?.();
                setIsDeleteArmed(false);
              }}
            />
            <ConfirmDeleteButton
              accessibilityLabel="Confirm delete task step"
              icon="trash-can-outline"
              onPress={() => focusAndRun(onDeletePress)}
            />
          </View>
        ) : (
          <Pressable
            accessibilityLabel="Prepare delete task step"
            accessibilityRole="button"
            onPress={() => {
              onFocus?.();
              setIsDeleteArmed(true);
            }}
            style={styles.deleteArea}
          >
            <Text selectable={false} style={styles.deleteText}>
              x
            </Text>
          </Pressable>
        )
      ) : (
        <Pressable
          onPress={() => focusAndRun(onExpandPress)}
          style={styles.expandArea}
        >
          <Primitives.ProgressCount
            color={nagPlanTheme.taskItem.progressText}
            done={taskItem.doneDescendantTaskItemCount}
            total={taskItem.descendantTaskItemCount}
          />
          <Primitives.ExpandIndicator
            color={nagPlanTheme.taskItem.chevronText}
            hasExpandableContent={hasChildren || forceExpandableIndicator}
            isExpanded={isExpanded}
          />
        </Pressable>
      )}
    </View>
  );
};

type ConfirmDeleteButtonProps = {
  readonly accessibilityLabel: string;
  readonly icon: string;
  readonly onPress: () => void;
};

const ConfirmDeleteButton = ({
  accessibilityLabel,
  icon,
  onPress,
}: ConfirmDeleteButtonProps) => {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [styles.confirmDeleteButton, pressed && styles.pressedButton]}
    >
      <Icon source={icon} size={17} color={nagPlanTheme.taskItem.chevronText} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  field: {
    alignItems: "center",
    borderRadius: nagPlanTheme.radius.control,
    flexDirection: "row",
    gap: nagPlanTheme.cardDensity.fieldGap,
    justifyContent: "space-between",
    paddingHorizontal: nagPlanTheme.cardDensity.fieldPaddingHorizontal,
    paddingVertical: nagPlanTheme.cardDensity.fieldPaddingVertical,
  },
  titleControl: {
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  title: {
    color: nagPlanTheme.taskItem.titleText,
    fontSize: nagPlanTheme.typography.taskItemTitleSize,
    fontWeight: nagPlanTheme.typography.taskItemTitleWeight,
  },
  titleInput: {
    color: nagPlanTheme.taskItem.titleText,
    fontSize: nagPlanTheme.typography.taskItemTitleSize,
    fontWeight: nagPlanTheme.typography.taskItemTitleWeight,
  },
  expandArea: {
    alignItems: "center",
    alignSelf: "stretch",
    borderRadius: nagPlanTheme.radius.control,
    flexDirection: "row",
    gap: 6,
    justifyContent: "flex-end",
    minWidth: 48,
    paddingHorizontal: nagPlanTheme.cardDensity.fieldPaddingHorizontal,
  },
  deleteArea: {
    alignItems: "center",
    alignSelf: "stretch",
    borderRadius: nagPlanTheme.radius.control,
    justifyContent: "center",
    minWidth: 48,
    paddingHorizontal: nagPlanTheme.cardDensity.fieldPaddingHorizontal,
  },
  deleteConfirmArea: {
    alignItems: "center",
    alignSelf: "stretch",
    flexDirection: "row",
    gap: 4,
    justifyContent: "center",
    minWidth: 72,
  },
  deleteText: {
    color: nagPlanTheme.taskItem.chevronText,
    fontSize: nagPlanTheme.typography.taskItemTitleSize,
    fontWeight: "900",
    lineHeight: nagPlanTheme.typography.taskItemTitleSize,
  },
  confirmDeleteButton: {
    alignItems: "center",
    backgroundColor: nagPlanTheme.taskLog.background,
    borderColor: nagPlanTheme.selection.border,
    borderRadius: nagPlanTheme.radius.control,
    borderWidth: 1,
    height: 28,
    justifyContent: "center",
    minWidth: 32,
    paddingHorizontal: 5,
  },
  pressedButton: {
    backgroundColor: nagPlanTheme.taskItem.pressedBackground,
  },
});
