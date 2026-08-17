import { Pressable, StyleSheet, Text } from "react-native";
import { modalTheme } from "./theme";

type SheetCloseButtonProps = {
  readonly onPress: () => void;
};

export function SheetCloseButton({ onPress }: SheetCloseButtonProps) {
  return (
    <Pressable
      accessibilityLabel="Close modal"
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressedButton]}
    >
      <Text selectable={false} style={styles.text}>
        ×
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "transparent",
    justifyContent: "center",
    minHeight: 32,
    minWidth: 32,
  },
  pressedButton: {
    opacity: 0.62,
  },
  text: {
    color: modalTheme.sheet.closeIcon,
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 32,
  },
});
