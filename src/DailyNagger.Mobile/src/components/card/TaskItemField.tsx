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
  readonly showComponentOutlines?: boolean;
  readonly muteCheckmark?: boolean;
  readonly checkmarkShape?: "circle" | "square";
  readonly onFocus?: () => void;
  readonly onNameFocus?: () => void;
  readonly onNameCommit?: (name: string) => void;
  readonly onDonePress?: () => void;
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
  showComponentOutlines = false,
  muteCheckmark = false,
  checkmarkShape = "square",
  onFocus,
  onNameFocus,
  onNameCommit,
  onDonePress,
  onExpandPress,
  onPressTag,
}: TaskItemFieldProps) => {
  const shouldShowTag = taskItem.tag !== null || showComponentOutlines;
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
          style={[
            cardRowLayout.textInput,
            styles.titleInput,
            showComponentOutlines && styles.outlinedComponent,
          ]}
        />
      ) : (
        <Pressable
          onPress={() => focusAndRun(onExpandPress)}
          style={[cardRowLayout.textSlot, styles.titlePressable]}
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

      <Pressable
        onPress={() => focusAndRun(onExpandPress)}
        style={({ pressed }) => [styles.expandArea, pressed && styles.pressedArea]}
      >
        <Primitives.ProgressCount
          color={nagPlanTheme.taskItem.progressText}
          done={taskItem.doneDescendantTaskItemCount}
          total={taskItem.descendantTaskItemCount}
        />
        <Primitives.ExpandIndicator
          color={nagPlanTheme.taskItem.chevronText}
          hasExpandableContent={hasChildren}
          isExpanded={isExpanded}
        />
      </Pressable>
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
  pressedArea: {
    backgroundColor: nagPlanTheme.taskItem.pressedBackground,
  },
  titlePressable: {
    paddingHorizontal: nagPlanTheme.cardDensity.fieldPaddingHorizontal,
    paddingVertical: nagPlanTheme.cardDensity.fieldPaddingVertical,
  },
  title: {
    color: nagPlanTheme.taskItem.titleText,
    fontSize: 17,
    fontWeight: "700",
  },
  titleInput: {
    color: nagPlanTheme.taskItem.titleText,
    fontSize: 17,
    fontWeight: "700",
    paddingHorizontal: 0,
    paddingVertical: 0,
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
  outlinedComponent: {
    borderColor: "#9fb7c3",
    borderRadius: 10,
    borderStyle: "dashed",
    borderWidth: 2,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
});
