import { Pressable, StyleSheet, Text, View } from "react-native";
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
  const shouldShowTag = showTag && (taskItem.tag !== null || showComponentOutlines);
  const tagText = taskItem.tag ?? "tag";

  function focusAndRun(action?: () => void) {
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
          onFocus={onNameFocus}
          onTouchStart={onFocus}
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
        <Pressable
          onPress={() => focusAndRun(onDeletePress)}
          style={styles.deleteArea}
        >
          <Text selectable={false} style={styles.deleteText}>
            x
          </Text>
        </Pressable>
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
  deleteText: {
    color: nagPlanTheme.taskItem.chevronText,
    fontSize: nagPlanTheme.typography.taskItemTitleSize,
    fontWeight: "900",
    lineHeight: nagPlanTheme.typography.taskItemTitleSize,
  },
});
