import type { TaskEntry } from "@/models";
import { CommitTextInput, type DraftParseResult } from "./CommitTextInput";
import { TaskEntryBooleanInput } from "./TaskEntryBooleanInput";
import { nagPlanTheme } from "@/features/nag-plan/theme";
import { assertNever } from "@/shared";
import type { StyleProp, TextInputProps, TextStyle, ViewStyle } from "react-native";

type TaskEntryValueInputProps = {
  readonly taskEntry: TaskEntry;
  readonly editable: boolean;
  readonly decimalSeparator?: "." | ",";
  readonly onFocus: () => void;
  readonly onCommit: (value: string | null) => void;
  readonly commitOnChange?: boolean;
  readonly onPressValueType?: () => void;
  readonly showEditFrame?: boolean;
  readonly style: StyleProp<TextStyle & ViewStyle>;
};

export const TaskEntryValueInput = (props: TaskEntryValueInputProps) => {
  const { taskEntry } = props;

  switch (taskEntry.valueType) {
    case "Text":
      return textInput(props);
    case "Decimal":
      return textInput(props, "right", "decimal-pad", (rawText) =>
        parseDecimalDraft(rawText, props.decimalSeparator ?? "."),
      );
    case "Integer":
      return textInput(props, "right", "numeric", parseIntegerDraft);
    case "Boolean":
      return booleanInput(props);
    default:
      return assertNever(taskEntry.valueType);
  }
};

function textInput(
  props: TaskEntryValueInputProps,
  textAlign: TextStyle["textAlign"] = "left",
  keyboardType?: TextInputProps["keyboardType"],
  parseDraft?: (rawText: string) => DraftParseResult<string | null>,
) {
  const {
    commitOnChange = false,
    decimalSeparator = ".",
    editable,
    taskEntry,
    onCommit,
    onFocus,
    showEditFrame = false,
    style,
  } = props;
  const value =
    taskEntry.valueType === "Decimal"
      ? (taskEntry.value ?? "").replace(".", decimalSeparator)
      : (taskEntry.value ?? "");
  const isTextValue = taskEntry.valueType === "Text";
  const placeholder = getPlaceholderForValueType(taskEntry, decimalSeparator);

  return (
    <CommitTextInput
      key={`${taskEntry.id}:${taskEntry.valueType}`}
      value={value}
      placeholder={placeholder}
      placeholderTextColor={nagPlanTheme.taskEntry.referenceText}
      onCommit={onCommit}
      commitOnChange={commitOnChange}
      parseDraft={parseDraft}
      onFocus={onFocus}
      editable={editable}
      keyboardType={keyboardType}
      multiline={isTextValue}
      showEditFrame={showEditFrame}
      textAlign={textAlign}
      style={style}
      invalidInitialStyle={styles.invalidInitialValue}
    />
  );
}

function getPlaceholderForValueType(taskEntry: TaskEntry, decimalSeparator: string): string {
  const referenceValue = taskEntry.lastTaskRunReferenceValue;

  if (referenceValue !== null) {
    return taskEntry.valueType === "Decimal"
      ? referenceValue.replace(".", decimalSeparator)
      : referenceValue;
  }

  switch (taskEntry.valueType) {
    case "Boolean":
      return "false";
    case "Decimal":
      return `0${decimalSeparator}00`;
    case "Integer":
      return "0";
    case "Text":
      return "Abc...";
    default:
      assertNever(taskEntry.valueType);
  }
}

function booleanInput(props: TaskEntryValueInputProps) {
  const { editable, taskEntry, onCommit, onFocus, onPressValueType } = props;

  const isChecked = isYes(taskEntry.value);
  const isReferenceChecked = !isChecked && isYes(taskEntry.lastTaskRunReferenceValue);
  const label = isChecked || isReferenceChecked ? "Yes" : "No";

  return (
    <TaskEntryBooleanInput
      checked={isChecked}
      referenceChecked={isReferenceChecked}
      label={label}
      style={props.style}
      compact
      onPress={() => {
        onFocus();
        if (editable) {
          onCommit(isChecked ? "false" : "true");
          return;
        }

        onPressValueType?.();
      }}
    />
  );
}

function parseDecimalDraft(
  rawText: string,
  decimalSeparator: "." | ",",
): DraftParseResult<string | null> {
  const serverText = rawText.replace(decimalSeparator, ".");
  const dotCount = countCharacters(serverText, ".");

  if (dotCount > 1) return { accepted: false };
  if (serverText === "") return acceptedNumericDraft("", null, decimalSeparator);
  if (serverText === ".") return acceptedNumericDraft(".", null, decimalSeparator);

  const hasTrailingDot = serverText.endsWith(".");
  const commitCandidate = hasTrailingDot ? serverText.slice(0, -1) : serverText;

  if (commitCandidate === "") return acceptedNumericDraft(serverText, null, decimalSeparator);
  if (isNaN(Number(commitCandidate))) return { accepted: false };

  return acceptedNumericDraft(serverText, commitCandidate, decimalSeparator);
}

function parseIntegerDraft(rawText: string): DraftParseResult<string | null> {
  if (rawText === "") {
    return {
      accepted: true,
      fieldValue: "",
      commitValue: null,
    };
  }

  if (!Number.isInteger(Number(rawText))) return { accepted: false };

  return {
    accepted: true,
    fieldValue: rawText,
    commitValue: parseInt(rawText, 10).toString(),
  };
}

function acceptedNumericDraft(
  serverText: string,
  commitValue: string | null,
  decimalSeparator: "." | ",",
): DraftParseResult<string | null> {
  return {
    accepted: true,
    fieldValue: serverText.replace(".", decimalSeparator),
    commitValue,
  };
}

function countCharacters(text: string, character: string): number {
  return [...text].filter((currentCharacter) => currentCharacter === character).length;
}

function isYes(value: string | null): boolean {
  return value !== null && value !== "" && value !== "false";
}

const styles = {
  invalidInitialValue: {
    backgroundColor: "#fff1f0",
    borderColor: "#c0392b",
    borderWidth: 2,
  },
} satisfies Record<string, StyleProp<TextStyle>>;
