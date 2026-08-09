import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, FlatList } from "react-native";
import { appLimits } from "@/config";
import { useTags, type TagType } from "@/tagging";
import { KeyboardLiftRegion, SheetModal } from "./SheetModal";

type TagSortMode = "recent" | "alphabetical";

export type TaggingModalProps = {
  readonly visible: boolean;
  readonly tagType: TagType;
  readonly tagName: string | null;
  readonly onDismiss: () => void;
  readonly onSave: (tagName: string | null) => void;
};

export function TaggingModal({
  visible,
  tagType,
  tagName,
  onDismiss,
  onSave,
}: TaggingModalProps) {
  const [draftTagName, setDraftTagName] = useState(tagName ?? "");
  const [draftTagDescription, setDraftTagDescription] = useState("");
  const [sortMode, setSortMode] = useState<TagSortMode>("recent");
  const tagNameInputRef = useRef<TextInput>(null);
  const hasInitializedOpenDraftRef = useRef(false);

  const tags = useTags(tagType);
  const { existingTags, isLoadingExistingTags, hasExistingTagLoadError } = tags;

  const exactMatchingTag = existingTags.find((tag) => tag.name === draftTagName.trim()) ?? null;

  const filteredTags = useMemo(() => {
    const trimmedTagName = draftTagName.trim();
    const searchText = trimmedTagName.toLocaleLowerCase();

    const matchingTags =
      searchText === ""
        ? existingTags
        : existingTags.filter((tag) => tag.name.toLocaleLowerCase().includes(searchText));

    const sortedTags = [...matchingTags].sort((left, right) => {
      if (sortMode === "alphabetical") {
        return left.name.localeCompare(right.name);
      }

      const leftTime = left.lastUsedAt?.getTime() ?? 0;
      const rightTime = right.lastUsedAt?.getTime() ?? 0;

      return rightTime - leftTime || left.name.localeCompare(right.name);
    });

    const exactMatchIndex = sortedTags.findIndex((tag) => tag.name === trimmedTagName);

    if (exactMatchIndex <= 0) return sortedTags;

    const sortedTagsWithExactMatchFirst = [...sortedTags];
    [sortedTagsWithExactMatchFirst[0], sortedTagsWithExactMatchFirst[exactMatchIndex]] = [
      sortedTagsWithExactMatchFirst[exactMatchIndex],
      sortedTagsWithExactMatchFirst[0],
    ];

    return sortedTagsWithExactMatchFirst;
  }, [draftTagName, existingTags, sortMode]);

  function saveTagName() {
    const trimmedTagName = draftTagName.trim();
    const trimmedDescription = draftTagDescription.trim();

    if (trimmedTagName !== "") {
      tags.saveTag({
        name: trimmedTagName,
        description: trimmedDescription === "" ? null : trimmedDescription,
      });
    }
    onSave(trimmedTagName === "" ? null : trimmedTagName);
  }

  function selectExistingTag(tag: (typeof existingTags)[number]) {
    setDraftTagName(tag.name);
    setDraftTagDescription(tag.description ?? "");
  }

  function changeDraftTagName(nextTagName: string) {
    setDraftTagName(nextTagName);

    const exactMatch = existingTags.find((tag) => tag.name === nextTagName.trim()) ?? null;
    if (exactMatch === null) return;

    setDraftTagDescription(exactMatch.description ?? "");
  }

  function clearDraft() {
    setDraftTagName("");
    setDraftTagDescription("");
    tagNameInputRef.current?.focus();
  }

  useEffect(() => {
    if (!visible) {
      hasInitializedOpenDraftRef.current = false;
      return;
    }
    if (hasInitializedOpenDraftRef.current) return;
    hasInitializedOpenDraftRef.current = true;

    const openedTagName = tagName ?? "";
    const openedTag = existingTags.find((tag) => tag.name === openedTagName) ?? null;

    setDraftTagName(openedTagName);
    setDraftTagDescription(openedTag?.description ?? "");
  }, [existingTags, tagName, visible]);

  return (
    <SheetModal
      visible={visible}
      owner="tagging-modal"
      title="Choose tag"
      onDismiss={onDismiss}
      footer={
        <View style={styles.actions}>
          <Pressable style={[styles.button, styles.secondaryButton]} onPress={clearDraft}>
            <Text style={styles.secondaryButtonText}>Clear</Text>
          </Pressable>
          <Pressable style={[styles.button, styles.primaryButton]} onPress={saveTagName}>
            <Text style={styles.primaryButtonText}>Save</Text>
          </Pressable>
        </View>
      }
    >
      <KeyboardLiftRegion>
        <View style={styles.controlRow}>
          <TextInput
            ref={tagNameInputRef}
            value={draftTagName}
            onChangeText={changeDraftTagName}
            maxLength={appLimits.tags.nameMaxLength}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.input, exactMatchingTag !== null && styles.exactMatchingInput]}
          />
          <View style={styles.sortActions}>
            <Pressable
              style={[styles.sortButton, sortMode === "recent" && styles.selectedSortButton]}
              onPress={() => setSortMode("recent")}
            >
              <Text style={styles.sortButtonText}>Recent</Text>
            </Pressable>
            <Pressable
              style={[styles.sortButton, sortMode === "alphabetical" && styles.selectedSortButton]}
              onPress={() => setSortMode("alphabetical")}
            >
              <Text style={styles.sortButtonText}>A-Z</Text>
            </Pressable>
          </View>
        </View>

        {isLoadingExistingTags && <Text style={styles.listStatus}>Loading tags...</Text>}

        {hasExistingTagLoadError && <Text style={styles.listStatus}>Could not load tags.</Text>}

        {!isLoadingExistingTags && !hasExistingTagLoadError && (
          <FlatList
            data={filteredTags}
            horizontal
            keyExtractor={(tag) => tag.name}
            keyboardShouldPersistTaps="handled"
            showsHorizontalScrollIndicator={false}
            style={styles.existingTagsList}
            contentContainerStyle={styles.existingTags}
            ListEmptyComponent={<Text style={styles.listStatus}>No matching tags.</Text>}
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.existingTag,
                  item.name === exactMatchingTag?.name && styles.exactMatchingTag,
                ]}
                onPress={() => selectExistingTag(item)}
              >
                <Text style={styles.existingTagText}>{item.name}</Text>
              </Pressable>
            )}
          />
        )}

        <TextInput
          value={draftTagDescription}
          onChangeText={setDraftTagDescription}
          placeholder="Description"
          placeholderTextColor="#6f7e87"
          multiline
          maxLength={appLimits.tags.descriptionMaxLength}
          style={styles.descriptionInput}
        />
      </KeyboardLiftRegion>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  controlRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  input: {
    backgroundColor: "#fffaf4",
    borderColor: "#d8d1c9",
    borderRadius: 6,
    borderWidth: 1,
    color: "#18242b",
    fontSize: 14,
    fontWeight: "800",
    width: 112,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  exactMatchingInput: {
    backgroundColor: "#e2dcf3",
    borderColor: "#756b92",
    borderWidth: 2,
  },
  existingTags: {
    flexDirection: "row",
    gap: 4,
  },
  sortActions: {
    flexDirection: "row",
    gap: 6,
  },
  sortButton: {
    borderColor: "#d8d1c9",
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  selectedSortButton: {
    backgroundColor: "#e2dcf3",
    borderColor: "#9fb7c3",
  },
  sortButtonText: {
    color: "#18242b",
    fontSize: 13,
    fontWeight: "900",
  },
  existingTag: {
    backgroundColor: "#e2dcf3",
    borderColor: "#9fb7c3",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  exactMatchingTag: {
    borderColor: "#756b92",
    borderWidth: 2,
  },
  existingTagText: {
    color: "#18242b",
    fontSize: 13,
    fontWeight: "900",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "flex-end",
  },
  button: {
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  primaryButton: {
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
  descriptionInput: {
    backgroundColor: "#fffaf4",
    borderColor: "#d8d1c9",
    borderRadius: 6,
    borderWidth: 1,
    color: "#18242b",
    fontSize: 14,
    fontWeight: "700",
    minHeight: 72,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: "top",
  },
  existingTagsList: {
    maxHeight: 48,
  },
  listStatus: {
    color: "#53636d",
    fontSize: 13,
    fontWeight: "800",
  },
});
