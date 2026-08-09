import { useMemo, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { appLimits } from "@/config";
import type { TaskItem } from "@/models";
import { KeyboardLiftRegion, SheetModal } from "./SheetModal";

type RolloverChoice = "single-use" | "persistent";

type SuggestedTaskStepName = {
  readonly name: string;
};

type SuggestionRowItem =
  | {
      readonly kind: "suggestion";
      readonly suggestion: SuggestedTaskStepName;
      readonly key: string;
    }
  | {
      readonly kind: "empty";
      readonly key: string;
    };

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

  const exactMatchingName = suggestions.find((suggestion) => suggestion.name === draftName.trim());

  const filteredSuggestions = useMemo(() => {
    const trimmedName = draftName.trim();
    const searchText = trimmedName.toLocaleLowerCase();

    const matchingSuggestions =
      searchText === ""
        ? suggestions
        : suggestions.filter((suggestion) =>
            suggestion.name.toLocaleLowerCase().includes(searchText),
          );

    const sortedSuggestions = [...matchingSuggestions].sort((left, right) =>
      left.name.localeCompare(right.name),
    );

    const exactMatchIndex = sortedSuggestions.findIndex(
      (suggestion) => suggestion.name === trimmedName,
    );

    if (exactMatchIndex <= 0) return sortedSuggestions;

    const sortedSuggestionsWithExactMatchFirst = [...sortedSuggestions];
    [sortedSuggestionsWithExactMatchFirst[0], sortedSuggestionsWithExactMatchFirst[exactMatchIndex]] =
      [
        sortedSuggestionsWithExactMatchFirst[exactMatchIndex],
        sortedSuggestionsWithExactMatchFirst[0],
      ];

    return sortedSuggestionsWithExactMatchFirst;
  }, [draftName, suggestions]);

  const suggestionRows = useMemo(() => {
    const rows: SuggestionRowItem[] = filteredSuggestions.map((suggestion, index) => ({
      kind: "suggestion",
      suggestion,
      key: `${suggestion.name}-${index}`,
    }));

    if (rows.length % 2 === 1) rows.push({ kind: "empty", key: "empty-last-cell" });

    return rows;
  }, [filteredSuggestions]);

  function selectExistingName(suggestion: SuggestedTaskStepName) {
    setDraftName(suggestion.name);
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
      headerAction={
        <View style={styles.sortBadge}>
          <Text style={styles.sortBadgeText}>A-Z</Text>
        </View>
      }
      headerActionPlacement="title-row"
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
        <View>
          <TextInput
            ref={nameInputRef}
            value={draftName}
            onChangeText={setDraftName}
            maxLength={appLimits.tags.nameMaxLength}
            autoFocus
            autoCapitalize="sentences"
            autoCorrect
            style={[styles.input, exactMatchingName !== undefined && styles.exactMatchingInput]}
          />
        </View>

        <View style={styles.suggestionsSection}>
          <FlatList
            columnWrapperStyle={styles.existingNamesRow}
            data={suggestionRows}
            keyExtractor={(suggestionRow) => suggestionRow.key}
            keyboardShouldPersistTaps="handled"
            numColumns={2}
            showsVerticalScrollIndicator
            style={styles.existingNamesList}
            contentContainerStyle={styles.existingNames}
            ListEmptyComponent={<Text style={styles.listStatus}>No matching names.</Text>}
            renderItem={({ item }) =>
              item.kind === "empty" ? (
                <View style={styles.emptyNameCell} />
              ) : (
                <Pressable
                  style={[
                    styles.existingName,
                    item.suggestion.name === exactMatchingName?.name && styles.exactMatchingName,
                  ]}
                  onPress={() => selectExistingName(item.suggestion)}
                >
                  <Text style={styles.existingNameText}>{item.suggestion.name}</Text>
                </Pressable>
              )
            }
          />
        </View>
      </KeyboardLiftRegion>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: "#fffaf4",
    borderColor: "#d8d1c9",
    borderRadius: 6,
    borderWidth: 1,
    color: "#18242b",
    fontSize: 18,
    fontWeight: "800",
    paddingHorizontal: 10,
    paddingVertical: 10,
    width: "100%",
  },
  exactMatchingInput: {
    backgroundColor: "#e2dcf3",
    borderColor: "#756b92",
    borderWidth: 2,
  },
  existingNames: {
    gap: 8,
  },
  existingNamesRow: {
    gap: 8,
  },
  sortBadge: {
    backgroundColor: "#e2dcf3",
    borderColor: "#9fb7c3",
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sortBadgeText: {
    color: "#18242b",
    fontSize: 13,
    fontWeight: "900",
  },
  existingName: {
    backgroundColor: "#e2dcf3",
    borderColor: "#9fb7c3",
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  emptyNameCell: {
    flex: 1,
  },
  exactMatchingName: {
    borderColor: "#756b92",
    borderWidth: 2,
  },
  existingNameText: {
    color: "#18242b",
    fontSize: 14,
    fontWeight: "900",
  },
  suggestionsSection: {
    height: 156,
  },
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
  existingNamesList: {
    flex: 1,
  },
  listStatus: {
    color: "#53636d",
    fontSize: 13,
    fontWeight: "800",
  },
});
