import type { TaskEntryValueType } from "@/api";
import type { TaskEntry } from "@/models";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SheetModal } from "./SheetModal";
import { useState } from "react";
import { modalTheme } from "./theme";

export type TaskEntryValueTypeModalProps = {
  readonly visible: boolean;
  readonly selectedValueType: TaskEntryValueType;
  readonly selectedRolloverBehavior: TaskEntry["rolloverBehavior"];
  readonly onDismiss: () => void;
  readonly onSelect: (
    valueType: TaskEntryValueType,
    rolloverBehavior: TaskEntry["rolloverBehavior"],
  ) => void;
};

const valueTypes = [
  "Text",
  "Integer",
  "Decimal",
  "Boolean",
] satisfies readonly TaskEntryValueType[];

const valueTypeLabels = {
  Boolean: "Yes/No",
  Decimal: "Decimal",
  Integer: "Integer",
  Text: "Text",
} satisfies Record<TaskEntryValueType, string>;

const rolloverBehaviorOptions = [
  { label: "Log", value: "MoveValueToHistory" },
  { label: "Keep", value: "CarryOverValue" },
] satisfies readonly {
  readonly label: string;
  readonly value: TaskEntry["rolloverBehavior"];
}[];

export const TaskEntryValueTypeModal = (props: TaskEntryValueTypeModalProps) => {
  const { selectedValueType, visible, onDismiss, onSelect } = props;
  const [draftValueType, setDraftValueType] = useState(selectedValueType);
  const [draftRolloverBehavior, setDraftRolloverBehavior] = useState(() =>
    getTaskEntryValueRolloverBehavior(props.selectedRolloverBehavior),
  );

  const saveDraft = () => {
    onSelect(draftValueType, draftRolloverBehavior);
  };

  return (
    <SheetModal
      visible={visible}
      owner="task-entry-value-type-modal"
      title="Choose value type"
      onDismiss={onDismiss}
      footer={
        <View style={styles.actions}>
          <Pressable style={[styles.button, styles.secondaryButton]} onPress={onDismiss}>
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </Pressable>
          <Pressable style={[styles.button, styles.primaryButton]} onPress={saveDraft}>
            <Text style={styles.primaryButtonText}>Done</Text>
          </Pressable>
        </View>
      }
    >
      <View style={styles.segmentedControl}>
        {rolloverBehaviorOptions.map((option) =>
          rolloverBehaviorOption(option, draftRolloverBehavior, setDraftRolloverBehavior),
        )}
      </View>

      <Text style={styles.sectionLabel}>Value type</Text>

      {valueTypes.map((valueType) => {
        return valueTypeOption(valueType, draftValueType, setDraftValueType);
      })}
    </SheetModal>
  );
};

const valueTypeOption = (
  valueType: TaskEntryValueType,
  draftValueType: TaskEntryValueType,
  setDraftValueType: (valueType: TaskEntryValueType) => void,
) => {
  const isSelected = valueType === draftValueType;

  return (
    <Pressable
      key={valueType}
      style={[styles.option, isSelected && styles.selectedOption]}
      onPress={() => setDraftValueType(valueType)}
    >
      <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
        {valueTypeLabels[valueType]}
      </Text>
    </Pressable>
  );
};

function rolloverBehaviorOption(
  option: (typeof rolloverBehaviorOptions)[number],
  draftRolloverBehavior: "MoveValueToHistory" | "CarryOverValue",
  setDraftRolloverBehavior: (
    rolloverBehavior: "MoveValueToHistory" | "CarryOverValue",
  ) => void,
) {
  const isSelected = option.value === draftRolloverBehavior;

  return (
    <Pressable
      key={option.value}
      style={[
        styles.segment,
        isSelected &&
          option.value === "MoveValueToHistory" &&
          styles.selectedLogSegment,
        isSelected &&
          option.value === "CarryOverValue" &&
          styles.selectedKeepSegment,
      ]}
      onPress={() => setDraftRolloverBehavior(option.value)}
    >
      <Text style={[styles.segmentText, isSelected && styles.selectedSegmentText]}>
        {option.label}
      </Text>
    </Pressable>
  );
}

function getTaskEntryValueRolloverBehavior(
  rolloverBehavior: TaskEntry["rolloverBehavior"],
): "MoveValueToHistory" | "CarryOverValue" {
  return rolloverBehavior === "CarryOverValue" ? "CarryOverValue" : "MoveValueToHistory";
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
  },
  button: {
    alignItems: "center",
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 96,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  primaryButton: {
    backgroundColor: "#d97828",
    borderColor: "#d97828",
  },
  primaryButtonText: {
    color: "#1a1b1d",
    fontSize: 15,
    fontWeight: "900",
  },
  secondaryButton: {
    borderColor: "#d8d1c9",
  },
  secondaryButtonText: {
    color: "#18242b",
    fontSize: 15,
    fontWeight: "900",
  },
  segmentedControl: {
    flexDirection: "row",
    gap: 8,
  },
  segment: {
    alignItems: "center",
    backgroundColor: "#fffdf8",
    borderColor: "#d8d1c9",
    borderRadius: 6,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectedLogSegment: {
    backgroundColor: "#e8ecec",
    borderColor: "#9fb7c3",
  },
  selectedKeepSegment: {
    backgroundColor: "#fff2bf",
    borderColor: "#e0bc56",
  },
  segmentText: {
    color: "#18242b",
    fontSize: 16,
    fontWeight: "900",
  },
  selectedSegmentText: {
    color: "#1a1b1d",
  },
  sectionLabel: {
    color: "#53636d",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 6,
    textTransform: "uppercase",
  },
  option: {
    borderColor: "#d8d1c9",
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectedOption: {
    backgroundColor: modalTheme.valuePicker.selectedBackground,
    borderColor: modalTheme.valuePicker.selectedBorder,
  },
  optionText: {
    color: "#18242b",
    fontSize: 16,
    fontWeight: "800",
  },
  selectedOptionText: {
    color: modalTheme.valuePicker.selectedText,
  },
});
