import { appTiming } from "@/config";
import { editableFrame, inactiveEditableFrame } from "@/components/primitives/editableFrame";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { StyleProp, TextInputProps, TextStyle } from "react-native";
import { TextInput } from "react-native";

type CommitTextInputProps<TCommitValue extends string | null = string> = {
  readonly mode?: "title" | "value";
  readonly value: string;
  readonly onCommit: (value: TCommitValue) => void;
  readonly parseDraft?: (rawText: string) => DraftParseResult<TCommitValue>;
  readonly commitDelayMs?: number;
  readonly style?: StyleProp<TextStyle>;
  readonly invalidInitialStyle?: StyleProp<TextStyle>;
  readonly keyboardType?: TextInputProps["keyboardType"];
  readonly placeholder?: string;
  readonly placeholderTextColor?: string;
  readonly onFocus?: TextInputProps["onFocus"];
  readonly onTouchStart?: TextInputProps["onTouchStart"];
  readonly editable?: boolean;
  readonly showEditFrame?: boolean;
  readonly fitContent?: boolean;
  readonly fitContentCharacterWidth?: number;
  readonly fitContentMinWidth?: number;
  readonly fitContentMaxWidth?: number;
  readonly textAlign?: TextStyle["textAlign"];
  readonly commitOnChange?: boolean;
  readonly multiline?: boolean;
  readonly multilineMinHeight?: number;
  readonly multilineMaxHeight?: number;
};

export type DraftParseResult<TCommitValue extends string | null = string> =
  | {
      readonly accepted: false;
    }
  | {
      readonly accepted: true;
      readonly fieldValue: string;
      readonly commitValue: TCommitValue;
    };

const estimatedCharacterWidth = 10;
const inputHorizontalBuffer = 18;

export function CommitTextInput<TCommitValue extends string | null = string>({
  mode = "value",
  value,
  onCommit,
  parseDraft,
  commitDelayMs = appTiming.input.autoCommitDelayMs,
  style,
  invalidInitialStyle,
  keyboardType,
  placeholder,
  placeholderTextColor,
  onFocus,
  onTouchStart,
  editable = true,
  showEditFrame = false,
  fitContent = false,
  fitContentCharacterWidth = estimatedCharacterWidth,
  fitContentMinWidth = 40,
  fitContentMaxWidth = 420,
  textAlign = "left",
  commitOnChange = false,
  multiline = false,
  multilineMinHeight = 36,
  multilineMaxHeight = 120,
}: CommitTextInputProps<TCommitValue>) {
  const parseDraftValue =
    parseDraft ?? (acceptTextDraft as (rawText: string) => DraftParseResult<TCommitValue>);
  const initialDraft = parseDraftValue(value);
  const initialAcceptedDraft = initialDraft.accepted
    ? initialDraft
    : ({
        accepted: true,
        fieldValue: value,
        commitValue: value,
      } as DraftParseResult<TCommitValue> & { readonly accepted: true });

  const [draftValue, setDraftValue] = useState(initialAcceptedDraft.fieldValue);
  const draftValueRef = useRef(initialAcceptedDraft.fieldValue);
  const draftRef = useRef(initialAcceptedDraft);
  const committedValueRef = useRef(initialAcceptedDraft.commitValue);
  const shouldReplaceInvalidInitialValueRef = useRef(!initialDraft.accepted);
  const [hasInvalidInitialValue, setHasInvalidInitialValue] = useState(!initialDraft.accepted);
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCommitRef = useRef(onCommit);
  const onFocusRef = useRef(onFocus);
  const onTouchStartRef = useRef(onTouchStart);

  useEffect(() => {
    onCommitRef.current = onCommit;
    onFocusRef.current = onFocus;
    onTouchStartRef.current = onTouchStart;
  }, [onCommit, onFocus, onTouchStart]);

  const commitDraft = useCallback(() => {
    stopCommitTimer(timerRef);

    const valueToCommit = draftRef.current.commitValue;
    if (valueToCommit === committedValueRef.current) return;

    committedValueRef.current = valueToCommit;
    onCommitRef.current(valueToCommit);
  }, []);

  useEffect(() => {
    return () => stopCommitTimer(timerRef);
  }, []);

  const restartCommitTimer = useCallback(() => {
    stopCommitTimer(timerRef);

    timerRef.current = setTimeout(() => {
      commitDraft();
    }, commitDelayMs);
  }, [commitDelayMs, commitDraft]);

  const setDraft = useCallback(
    (rawText: string) => {
      const textToParse = shouldReplaceInvalidInitialValueRef.current
        ? getReplacementTextForInvalidInitialValue(rawText, draftValueRef.current)
        : rawText;
      const nextDraft = parseDraftValue(textToParse);
      if (!nextDraft.accepted) return;

      shouldReplaceInvalidInitialValueRef.current = false;
      setHasInvalidInitialValue(false);
      draftRef.current = nextDraft;
      draftValueRef.current = nextDraft.fieldValue;
      setDraftValue(nextDraft.fieldValue);
      if (commitOnChange) {
        commitDraft();
        return;
      }

      restartCommitTimer();
    },
    [commitDraft, commitOnChange, parseDraftValue, restartCommitTimer],
  );

  const handleFocus = useCallback<NonNullable<TextInputProps["onFocus"]>>((event) => {
    onFocusRef.current?.(event);
  }, []);

  const handleTouchStart = useCallback<NonNullable<TextInputProps["onTouchStart"]>>((event) => {
    onTouchStartRef.current?.(event);
  }, []);

  const handleContentSizeChange = useMemo(() => {
    if (!multiline) return undefined;

    return (event: Parameters<NonNullable<TextInputProps["onContentSizeChange"]>>[0]) => {
      const nextHeight = Math.ceil(event.nativeEvent.contentSize.height);
      setContentHeight((currentHeight) =>
        currentHeight === nextHeight ? currentHeight : nextHeight,
      );
    };
  }, [multiline]);

  const fitContentWidth = fitContent
    ? Math.min(
        Math.max(
          draftValue.length * fitContentCharacterWidth + inputHorizontalBuffer,
          fitContentMinWidth,
        ),
        fitContentMaxWidth,
      )
    : undefined;
  const multilineHeight =
    multiline && contentHeight !== null
      ? Math.min(Math.max(contentHeight, multilineMinHeight), multilineMaxHeight)
      : undefined;
  const inputStyle = useMemo(
    () => [
      inactiveEditableFrame,
      style,
      hasInvalidInitialValue && invalidInitialStyle,
      fitContentWidth === undefined ? undefined : { width: fitContentWidth },
      multiline
        ? {
            height: multilineHeight,
            maxHeight: multilineMaxHeight,
            minHeight: multilineMinHeight,
            textAlignVertical: "top" as const,
          }
        : undefined,
      showEditFrame && editableFrame,
      webFocusOutlineHiddenStyle,
      { textAlign },
    ],
    [
      fitContentWidth,
      hasInvalidInitialValue,
      invalidInitialStyle,
      multiline,
      multilineHeight,
      multilineMaxHeight,
      multilineMinHeight,
      showEditFrame,
      style,
      textAlign,
    ],
  );

  return (
    <StableTextInput
      value={draftValue}
      onChangeText={setDraft}
      onBlur={commitDraft}
      onFocus={onFocus === undefined ? undefined : handleFocus}
      onTouchStart={onTouchStart === undefined ? undefined : handleTouchStart}
      onContentSizeChange={handleContentSizeChange}
      editable={editable}
      pointerEvents={editable ? "auto" : "none"}
      style={inputStyle}
      keyboardType={keyboardType}
      multiline={multiline}
      placeholder={placeholder}
      placeholderTextColor={placeholderTextColor}
      scrollEnabled={multiline && contentHeight !== null && contentHeight > multilineMaxHeight}
    />
  );
}

type StableTextInputProps = {
  readonly value: string;
  readonly onChangeText: TextInputProps["onChangeText"];
  readonly onBlur: TextInputProps["onBlur"];
  readonly onFocus?: TextInputProps["onFocus"];
  readonly onTouchStart?: TextInputProps["onTouchStart"];
  readonly onContentSizeChange?: TextInputProps["onContentSizeChange"];
  readonly editable: boolean;
  readonly pointerEvents: TextInputProps["pointerEvents"];
  readonly style: StyleProp<TextStyle>;
  readonly keyboardType?: TextInputProps["keyboardType"];
  readonly multiline: boolean;
  readonly placeholder?: string;
  readonly placeholderTextColor?: string;
  readonly scrollEnabled: boolean;
};

const StableTextInput = memo(function StableTextInput({
  value,
  onChangeText,
  onBlur,
  onFocus,
  onTouchStart,
  onContentSizeChange,
  editable,
  pointerEvents,
  style,
  keyboardType,
  multiline,
  placeholder,
  placeholderTextColor,
  scrollEnabled,
}: StableTextInputProps) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      onBlur={onBlur}
      onFocus={onFocus}
      onTouchStart={onTouchStart}
      onContentSizeChange={onContentSizeChange}
      editable={editable}
      pointerEvents={pointerEvents}
      style={style}
      keyboardType={keyboardType}
      multiline={multiline}
      placeholder={placeholder}
      placeholderTextColor={placeholderTextColor}
      scrollEnabled={scrollEnabled}
    />
  );
});

const webFocusOutlineHiddenStyle = {
  outlineColor: "transparent",
  outlineWidth: 0,
} as const;

function getReplacementTextForInvalidInitialValue(rawText: string, currentText: string): string {
  if (rawText.startsWith(currentText)) return rawText.slice(currentText.length);
  if (rawText.length < currentText.length) return "";

  return rawText;
}

function stopCommitTimer(timerRef: { current: ReturnType<typeof setTimeout> | null }) {
  if (timerRef.current === null) return;

  clearTimeout(timerRef.current);
  timerRef.current = null;
}

function acceptTextDraft(rawText: string): DraftParseResult {
  return {
    accepted: true,
    fieldValue: rawText,
    commitValue: rawText,
  };
}
