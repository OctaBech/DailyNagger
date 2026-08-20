import { Pressable, StyleSheet, Text } from "react-native";
import { modalTheme } from "./theme";

type SheetButtonArea = "body" | "footer";
type SheetButtonTone = "choice" | "keep" | "primary" | "secondary";

type SheetButtonProps = {
  readonly area: SheetButtonArea;
  readonly disabled?: boolean;
  readonly label: string;
  readonly onPress: () => void;
  readonly selected?: boolean;
  readonly tone: SheetButtonTone;
};

export function SheetButton({
  area,
  disabled = false,
  label,
  onPress,
  selected = false,
  tone,
}: SheetButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        area === "footer" ? styles.footerArea : styles.bodyArea,
        getToneStyle(tone, selected, area),
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text selectable={false} style={[styles.label, getTextStyle(tone), disabled && styles.disabledText]}>
        {label}
      </Text>
    </Pressable>
  );
}

function getToneStyle(tone: SheetButtonTone, selected: boolean, area: SheetButtonArea) {
  switch (tone) {
    case "primary":
      return area === "footer" ? styles.primaryTone : styles.bodyPrimaryTone;
    case "secondary":
      return styles.secondaryTone;
    case "choice":
      return selected ? styles.selectedChoiceTone : styles.choiceTone;
    case "keep":
      return styles.keepTone;
  }
}

function getTextStyle(tone: SheetButtonTone) {
  switch (tone) {
    case "primary":
      return styles.primaryText;
    case "secondary":
      return styles.secondaryText;
    case "choice":
      return styles.choiceText;
    case "keep":
      return styles.keepText;
  }
}

const styles = StyleSheet.create({
  bodyArea: {
    borderRadius: modalTheme.modalButtonBody.borderRadius,
    minHeight: modalTheme.modalButtonBody.minHeight,
    paddingHorizontal: modalTheme.modalButtonBody.paddingHorizontal,
    paddingVertical: modalTheme.modalButtonBody.paddingVertical,
  },
  button: {
    alignItems: "center",
    borderWidth: 1,
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.42,
  },
  disabledText: {
    color: modalTheme.modalText.status,
  },
  bodyPrimaryTone: {
    backgroundColor: modalTheme.sheet.background,
    borderColor: modalTheme.modalButtonTone.primary.border,
  },
  choiceText: {
    color: modalTheme.modalButtonTone.choice.text,
  },
  choiceTone: {
    backgroundColor: modalTheme.modalButtonTone.choice.background,
    borderColor: modalTheme.modalButtonTone.choice.border,
  },
  footerArea: {
    borderRadius: modalTheme.modalButtonFooter.borderRadius,
    minHeight: modalTheme.modalButtonFooter.minHeight,
    paddingHorizontal: modalTheme.modalButtonFooter.paddingHorizontal,
    paddingVertical: modalTheme.modalButtonFooter.paddingVertical,
  },
  label: {
    fontSize: 16,
    fontWeight: "800",
  },
  keepText: {
    color: modalTheme.modalButtonTone.primary.text,
  },
  keepTone: {
    backgroundColor: modalTheme.rollover.keepBackground,
    borderColor: modalTheme.rollover.keepBorder,
  },
  pressed: {
    opacity: 0.72,
  },
  primaryText: {
    color: modalTheme.modalButtonTone.primary.text,
  },
  primaryTone: {
    backgroundColor: modalTheme.modalButtonTone.primary.background,
    borderColor: modalTheme.modalButtonTone.primary.border,
  },
  secondaryText: {
    color: modalTheme.modalButtonTone.secondary.text,
  },
  secondaryTone: {
    backgroundColor: modalTheme.modalButtonTone.secondary.background,
    borderColor: modalTheme.modalButtonTone.secondary.border,
  },
  selectedChoiceTone: {
    backgroundColor: modalTheme.modalButtonTone.choice.selectedBackground,
    borderColor: modalTheme.modalButtonTone.choice.selectedBorder,
  },
});
