import { useState } from "react";
import { StyleSheet, View } from "react-native";
import type { TaskEntryValueType } from "@/api";
import type { TaskEntry } from "@/models";
import { SheetButton } from "./SheetButton";
import { SheetFooterActions, SheetFooterSpacer } from "./SheetFooterActions";
import { SheetModal } from "./SheetModal";
import { SheetSegmentedControl } from "./SheetSegmentedControl";

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

const valueTypeOptions = [
  { label: "Text", value: "Text" },
  { label: "Integer", value: "Integer" },
  { label: "Decimal", value: "Decimal" },
  { label: "Yes/No", value: "Boolean" },
] satisfies readonly {
  readonly label: string;
  readonly value: TaskEntryValueType;
}[];

export const TaskEntryValueTypeModal = ({
  selectedValueType,
  visible,
  onDismiss,
  onSelect,
}: TaskEntryValueTypeModalProps) => {
  const [draftValueType, setDraftValueType] = useState(selectedValueType);

  function saveDraft(rolloverBehavior: "MoveValueToHistory" | "CarryOverValue"): void {
    onSelect(draftValueType, rolloverBehavior);
  }

  return (
    <SheetModal
      visible={visible}
      owner="task-entry-value-type-modal"
      title="Choose value type"
      onDismiss={onDismiss}
      footer={
        <SheetFooterActions>
          <SheetButton
            area="footer"
            label="Log"
            onPress={() => saveDraft("MoveValueToHistory")}
            tone="primary"
          />
          <SheetFooterSpacer />
          <SheetButton
            area="footer"
            label="Keep"
            onPress={() => saveDraft("CarryOverValue")}
            tone="keep"
          />
        </SheetFooterActions>
      }
    >
      <View style={styles.valueTypeControl}>
        <SheetSegmentedControl
          options={valueTypeOptions}
          orientation="vertical"
          value={draftValueType}
          onChange={setDraftValueType}
        />
      </View>
    </SheetModal>
  );
};

const styles = StyleSheet.create({
  valueTypeControl: {
    alignSelf: "center",
    width: "66%",
  },
});
