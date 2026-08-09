import type { TaskEntryValueType } from "@/api";
import { Pressable, StyleSheet, Text } from "react-native";
import { SheetModal } from "./SheetModal";

export type TaskEntryValueTypeModalProps = {
  readonly visible: boolean;
  readonly selectedValueType: TaskEntryValueType;
  readonly onDismiss: () => void;
  readonly onSelect: (valueType: TaskEntryValueType) => void;
};

const valueTypes = [
  "Text",
  "Integer",
  "Decimal",
  "Boolean",
] satisfies readonly TaskEntryValueType[];

export const TaskEntryValueTypeModal = (props: TaskEntryValueTypeModalProps) => {
  const { visible, onDismiss } = props;

  return (
    <SheetModal
      visible={visible}
      owner="task-entry-value-type-modal"
      title="Choose value type"
      onDismiss={onDismiss}
    >
      {valueTypes.map((valueType) => {
        return valueTypeOption(valueType, props);
      })}
    </SheetModal>
  );
};

const valueTypeOption = (valueType: TaskEntryValueType, props: TaskEntryValueTypeModalProps) => {
  const { selectedValueType, onSelect } = props;

  const isSelected = valueType === selectedValueType;

  return (
    <Pressable
      key={valueType}
      style={[styles.option, isSelected && styles.selectedOption]}
      onPress={() => onSelect(valueType)}
    >
      <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
        {valueType}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  option: {
    borderColor: "#d8d1c9",
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectedOption: {
    backgroundColor: "#d97828",
    borderColor: "#d97828",
  },
  optionText: {
    color: "#18242b",
    fontSize: 16,
    fontWeight: "800",
  },
  selectedOptionText: {
    color: "#1a1b1d",
  },
});
