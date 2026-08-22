import { useEffect, useMemo, useRef, useState } from "react";
import type { TextInput } from "react-native";
import { appLimits } from "@/config";
import { useTags, type TagType } from "@/tagging";
import { SheetButton } from "./SheetButton";
import { SheetFooterActions, SheetFooterSpacer } from "./SheetFooterActions";
import { type SheetNarrowBeltOption } from "./SheetNarrowBelt";
import { SheetNarrowPicker } from "./SheetNarrowPicker";
import { KeyboardLiftRegion, SheetModal } from "./SheetModal";
import { SheetTextArea } from "./SheetTextArea";

export type TaggingModalProps = {
  readonly visible: boolean;
  readonly tagType: TagType;
  readonly tagName: string | null;
  readonly onDismiss: () => void;
  readonly onSave: (tagName: string | null) => void;
};

export function TaggingModal({ visible, tagType, tagName, onDismiss, onSave }: TaggingModalProps) {
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
  const canSaveTag = !isLoadingExistingTags && !hasExistingTagLoadError;
  const visibleTagOptions = hasExistingTagLoadError ? [] : tagOptions;

  function saveTagName() {
    if (!canSaveTag) return;

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
        <SheetFooterActions>
          <SheetFooterSpacer />
          <SheetButton
            area="footer"
            disabled={!canSaveTag}
            label="Done"
            tone="primary"
            onPress={saveTagName}
          />
        </SheetFooterActions>
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
          options={visibleTagOptions}
        />

        <SheetTextArea
          value={draftTagDescription}
          onChangeText={setDraftTagDescription}
          placeholder="Description"
          maxLength={appLimits.tags.descriptionMaxLength}
        />
      </KeyboardLiftRegion>
    </SheetModal>
  );
}
