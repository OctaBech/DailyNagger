import { useMemo, useRef, useState } from "react";
import type { TextInput } from "react-native";
import { appLimits } from "@/config";
import type { TaskItem } from "@/models";
import { SheetButton } from "./SheetButton";
import { SheetFooterActions, SheetFooterSpacer } from "./SheetFooterActions";
import { type SheetNarrowBeltOption } from "./SheetNarrowBelt";
import { SheetNarrowPicker } from "./SheetNarrowPicker";
import { KeyboardLiftRegion, SheetModal } from "./SheetModal";

type RolloverChoice = "single-use" | "persistent";

type SuggestedTaskStepName = {
  readonly name: string;
};

const taskStepNameSortOptions = [{ label: "A-Z", value: "alphabetical" }] as const;

export type TaskStepNameModalProps = {
  readonly visible: boolean;
  readonly hasSuggestionLoadError?: boolean;
  readonly isLoadingSuggestions?: boolean;
  readonly suggestions?: readonly SuggestedTaskStepName[];
  readonly onAddTaskStep?: (name: string, rolloverBehavior: TaskItem["rolloverBehavior"]) => void;
  readonly onDismiss: () => void;
};

export function TaskStepNameModal({
  visible,
  hasSuggestionLoadError = false,
  isLoadingSuggestions = false,
  suggestions = [],
  onAddTaskStep,
  onDismiss,
}: TaskStepNameModalProps) {
  if (!visible) return null;

  return (
    <TaskStepNameModalContent
      visible={visible}
      hasSuggestionLoadError={hasSuggestionLoadError}
      isLoadingSuggestions={isLoadingSuggestions}
      suggestions={suggestions}
      onAddTaskStep={onAddTaskStep}
      onDismiss={onDismiss}
    />
  );
}

function TaskStepNameModalContent({
  visible,
  hasSuggestionLoadError = false,
  isLoadingSuggestions = false,
  suggestions = [],
  onAddTaskStep,
  onDismiss,
}: TaskStepNameModalProps) {
  const [draftName, setDraftName] = useState("");
  const nameInputRef = useRef<TextInput>(null);

  const suggestionOptions = useMemo<SheetNarrowBeltOption<SuggestedTaskStepName>[]>(
    () =>
      suggestions.map((suggestion) => ({
        label: suggestion.name,
        value: suggestion,
      })),
    [suggestions],
  );

  function selectExistingName(option: SheetNarrowBeltOption<SuggestedTaskStepName>) {
    setDraftName(option.value.name);
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
        <SheetFooterActions>
          <SheetButton
            area="footer"
            label="□ Always"
            tone="secondary"
            onPress={() => chooseRollover("persistent")}
          />
          <SheetFooterSpacer />
          <SheetButton
            area="footer"
            label="○ Once"
            tone="primary"
            onPress={() => chooseRollover("single-use")}
          />
        </SheetFooterActions>
      }
    >
      <KeyboardLiftRegion>
        <SheetNarrowPicker
          inputRef={nameInputRef}
          edgeToEdge
          emptyText="No matching names."
          value={draftName}
          onChangeText={setDraftName}
          maxLength={appLimits.tags.nameMaxLength}
          autoFocus
          autoCapitalize="sentences"
          autoCorrect
          isLoading={isLoadingSuggestions}
          loadingText="Loading names..."
          loadErrorText={hasSuggestionLoadError ? "Could not load names." : null}
          onPick={selectExistingName}
          options={suggestionOptions}
          sortOptions={taskStepNameSortOptions}
        />
      </KeyboardLiftRegion>
    </SheetModal>
  );
}
