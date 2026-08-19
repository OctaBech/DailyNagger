import { useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, type TextInput, View } from "react-native";
import { appLimits } from "@/config";
import type { TaskItem } from "@/models";
import { type SheetNarrowChipOption } from "./SheetNarrowChips";
import { SheetNarrowPicker } from "./SheetNarrowPicker";
import { KeyboardLiftRegion, SheetModal } from "./SheetModal";

type RolloverChoice = "single-use" | "persistent";

type SuggestedTaskStepName = {
  readonly name: string;
};

const taskStepNameSortOptions = [{ label: "A-Z", value: "alphabetical" }] as const;

export type TaskStepNameModalProps = {
  readonly visible: boolean;
  readonly suggestions?: readonly SuggestedTaskStepName[];
  readonly onAddTaskStep?: (name: string, rolloverBehavior: TaskItem["rolloverBehavior"]) => void;
  readonly onDismiss: () => void;
};

export function TaskStepNameModal({
  visible,
  suggestions = [],
  onAddTaskStep,
  onDismiss,
}: TaskStepNameModalProps) {
  if (!visible) return null;

  return (
    <TaskStepNameModalContent
      visible={visible}
      suggestions={suggestions}
      onAddTaskStep={onAddTaskStep}
      onDismiss={onDismiss}
    />
  );
}

function TaskStepNameModalContent({
  visible,
  suggestions = [],
  onAddTaskStep,
  onDismiss,
}: TaskStepNameModalProps) {
  const [draftName, setDraftName] = useState("");
  const nameInputRef = useRef<TextInput>(null);

  const suggestionOptions = useMemo<SheetNarrowChipOption<SuggestedTaskStepName>[]>(
    () =>
      suggestions.map((suggestion) => ({
        label: suggestion.name,
        value: suggestion,
      })),
    [suggestions],
  );

  function selectExistingName(option: SheetNarrowChipOption<SuggestedTaskStepName>) {
    setDraftName(option.value.name);
  }

  function clearDraft() {
    setDraftName("");
    nameInputRef.current?.focus();
  }

  function chooseRollover(rolloverChoice: RolloverChoice) {
    const name = draftName.trim();
    if (name === "") {
      nameInputRef.current?.focus();
      return;
    }

    const rolloverBehavior: TaskItem["rolloverBehavior"] =
      rolloverChoice === "single-use" ? "RemoveWhenDone" : "Keep";
    onAddTaskStep?.(name, rolloverBehavior);
    onDismiss();
  }

  return (
    <SheetModal
      visible={visible}
      owner="task-step-name-modal"
      title="Add task step"
      onDismiss={onDismiss}
      footer={
        <View style={styles.actions}>
          <Pressable style={[styles.button, styles.secondaryButton]} onPress={clearDraft}>
            <Text style={styles.secondaryButtonText}>Clear</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.singleUseButton]}
            onPress={() => chooseRollover("single-use")}
          >
            <Text style={styles.primaryButtonText}>Single use</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.persistentButton]}
            onPress={() => chooseRollover("persistent")}
          >
            <Text style={styles.primaryButtonText}>Persistent</Text>
          </Pressable>
        </View>
      }
    >
      <KeyboardLiftRegion>
        <SheetNarrowPicker
          inputRef={nameInputRef}
          edgeToEdge
          emptyText="No matching names."
          value={draftName}
          onChangeText={setDraftName}
          onClear={clearDraft}
          maxLength={appLimits.tags.nameMaxLength}
          autoFocus
          autoCapitalize="sentences"
          autoCorrect
          onPick={selectExistingName}
          options={suggestionOptions}
          sortOptions={taskStepNameSortOptions}
        />
      </KeyboardLiftRegion>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  actions: {
    borderTopColor: "#e4ded7",
    borderTopWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "flex-end",
    paddingTop: 12,
  },
  button: {
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  singleUseButton: {
    backgroundColor: "#f2d66f",
  },
  persistentButton: {
    backgroundColor: "#d97828",
  },
  primaryButtonText: {
    color: "#1a1b1d",
    fontSize: 15,
    fontWeight: "900",
  },
  secondaryButton: {
    borderColor: "#d8d1c9",
    borderWidth: 1,
  },
  secondaryButtonText: {
    color: "#18242b",
    fontSize: 15,
    fontWeight: "900",
  },
});
