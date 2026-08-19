import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { appLimits } from "@/config";
import { useTags, type TagType } from "@/tagging";
import { type SheetNarrowBeltOption } from "./SheetNarrowBelt";
import { SheetNarrowPicker } from "./SheetNarrowPicker";
import { KeyboardLiftRegion, SheetModal } from "./SheetModal";

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
  const tagNameInputRef = useRef<TextInput>(null);
  const hasInitializedOpenDraftRef = useRef(false);

  const tags = useTags(tagType);
  const { existingTags, isLoadingExistingTags, hasExistingTagLoadError } = tags;

  const tagOptions = useMemo<SheetNarrowBeltOption<(typeof existingTags)[number]>[]>(
    () =>
      existingTags.map((tag) => ({
        date: tag.lastUsedAt?.toISOString() ?? null,
        description: tag.description,
        label: tag.name,
        value: tag,
      })),
    [existingTags],
  );

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

  function selectExistingTag(option: SheetNarrowBeltOption<(typeof existingTags)[number]>) {
    setDraftTagName(option.value.name);
    setDraftTagDescription(option.value.description ?? "");
  }

  function changeDraftTagName(nextTagName: string) {
    setDraftTagName(nextTagName);

    const trimmedTagName = nextTagName.trim();
    if (trimmedTagName === "") {
      setDraftTagDescription("");
      return;
    }

    const exactMatch = existingTags.find((tag) => tag.name === trimmedTagName) ?? null;
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
            <Text style={styles.primaryButtonText}>Done</Text>
          </Pressable>
        </View>
      }
    >
      <KeyboardLiftRegion>
        <SheetNarrowPicker
          inputRef={tagNameInputRef}
          edgeToEdge
          emptyText="No matching tags."
          value={draftTagName}
          onChangeText={changeDraftTagName}
          maxLength={appLimits.tags.nameMaxLength}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          isLoading={isLoadingExistingTags}
          loadingText="Loading tags..."
          loadErrorText={hasExistingTagLoadError ? "Could not load tags." : null}
          onPick={selectExistingTag}
          options={tagOptions}
        />

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
});
