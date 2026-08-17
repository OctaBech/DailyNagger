import { Pressable, StyleSheet, Text, View } from "react-native";
import { modalTheme } from "./theme";

type SheetChipTone = "preview" | "selected";

type SheetChipProps = {
  readonly label: string;
  readonly onPress?: () => void;
  readonly tone: SheetChipTone;
};

export function SheetChip({ label, onPress, tone }: SheetChipProps) {
  const content = (
    <Text selectable={false} style={[styles.label, getToneLabelStyle(tone)]}>
      {label}
    </Text>
  );

  if (onPress === undefined) {
    return <View style={[styles.chip, getToneChipStyle(tone)]}>{content}</View>;
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, getToneChipStyle(tone), pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}

function getToneChipStyle(tone: SheetChipTone) {
  const toneTheme = modalTheme.modalChip.tone[tone];

  return {
    backgroundColor: toneTheme.background,
    borderColor: toneTheme.border,
  };
}

function getToneLabelStyle(tone: SheetChipTone) {
  return {
    color: modalTheme.modalChip.tone[tone].text,
  };
}

const styles = StyleSheet.create({
  chip: {
    alignItems: "center",
    borderRadius: modalTheme.modalChip.borderRadius,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: modalTheme.modalChip.minHeight,
    paddingHorizontal: modalTheme.modalChip.paddingHorizontal,
    paddingVertical: modalTheme.modalChip.paddingVertical,
  },
  label: {
    fontSize: modalTheme.modalChip.fontSize,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.72,
  },
});
