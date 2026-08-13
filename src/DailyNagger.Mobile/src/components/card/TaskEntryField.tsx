import type { TaskEntry } from "@/models";
import { Pressable, StyleSheet, View } from "react-native";
import * as Input from "@/components/input";
import * as Primitives from "@/components/primitives";
import { nagPlanTheme } from "@/features/nag-plan/theme";
import { cardRowLayout } from "./cardRowLayout";

type TaskEntryFieldProps = {
  readonly taskEntry: TaskEntry;
  readonly allowEditLabel: boolean;
  readonly allowEditTag: boolean;
  readonly allowEditValue: boolean;
  readonly decimalSeparator?: "." | ",";
  readonly commitValueOnChange?: boolean;
  readonly isTagPickerOpen?: boolean;
  readonly isValueTypePickerOpen?: boolean;
  readonly showTag?: boolean;
  readonly showComponentOutlines: boolean;
  readonly onFocus: () => void;
  readonly onLabelCommit: (label: string) => void;
  readonly onValueCommit: (value: string | null) => void;
  readonly onPressTag?: () => void;
  readonly onPressValueType?: () => void;
};

export const TaskEntryField = (props: TaskEntryFieldProps) => {
  const {
    taskEntry,
    allowEditLabel,
    allowEditTag,
    allowEditValue,
    decimalSeparator,
    commitValueOnChange = false,
    isTagPickerOpen = false,
    isValueTypePickerOpen = false,
    showTag = true,
    onFocus: selectTaskEntry,
    showComponentOutlines,
    onLabelCommit,
    onValueCommit,
    onPressTag,
    onPressValueType,
  } = props;

  const shouldShowTag = showTag && (taskEntry.tag !== null || showComponentOutlines);
  const tagText = taskEntry.tag ?? "tag";

  return (
    <View style={styles.field}>
      <Pressable onPress={selectTaskEntry} style={cardRowLayout.textSlot}>
        <Input.CommitTextInput
          mode="title"
          value={taskEntry.label}
          onCommit={onLabelCommit}
          onFocus={allowEditLabel ? selectTaskEntry : undefined}
          editable={allowEditLabel}
          showEditFrame={showComponentOutlines}
          style={[cardRowLayout.textInput, styles.labelInput]}
        />
      </Pressable>

      {shouldShowTag && (
        <Primitives.PillButton
          label={tagText}
          isEmpty={taskEntry.tag === null}
          maxWidth={48}
          showOutline={showComponentOutlines}
          isActive={isTagPickerOpen}
          onPress={() => {
            selectTaskEntry();
            if (allowEditTag) onPressTag?.();
          }}
        />
      )}

      <Pressable
        onPress={() => {
          if (!allowEditValue) selectTaskEntry();
          onPressValueType?.();
        }}
      >
        <Input.TaskEntryValueInput
          taskEntry={taskEntry}
          decimalSeparator={decimalSeparator}
          commitOnChange={commitValueOnChange}
          editable={allowEditValue}
          onCommit={onValueCommit}
          onFocus={selectTaskEntry}
          onPressValueType={onPressValueType}
          style={[
            styles.valueInput,
            taskEntry.rolloverBehavior === "CarryOverValue" && styles.carryOverValueInput,
            isValueTypePickerOpen && styles.activeValueTypeInput,
          ]}
          showEditFrame={showComponentOutlines}
        />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  field: {
    alignItems: "center",
    borderRadius: 6,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  labelInput: {
    color: "#243947",
    fontSize: nagPlanTheme.typography.taskEntryLabelSize,
    fontWeight: nagPlanTheme.typography.taskEntryLabelWeight,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  valueInput: {
    backgroundColor: "#f8f4ef",
    borderColor: "#d8d1c9",
    borderRadius: 6,
    borderWidth: 1,
    color: "#18242b",
    fontSize: nagPlanTheme.typography.taskEntryValueSize,
    fontWeight: nagPlanTheme.typography.taskEntryValueWeight,
    minWidth: 120,
    paddingHorizontal: 10,
    paddingVertical: 6,
    textAlign: "right",
  },
  carryOverValueInput: {
    backgroundColor: "#fff2bf",
    borderColor: "#e0bc56",
  },
  activeValueTypeInput: {
    borderColor: "#18242b",
    borderStyle: "solid",
  },
});
