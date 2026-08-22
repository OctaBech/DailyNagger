import { forwardRef } from "react";
import { Pressable, StyleSheet, Text, TextInput, type TextInputProps, View } from "react-native";
import { modalTheme } from "./theme";

type SheetSearchInputProps = Omit<TextInputProps, "style"> & {
  readonly hasExactMatch?: boolean;
};

export const SheetSearchInput = forwardRef<TextInput, SheetSearchInputProps>(
  function SheetSearchInput(
    { hasExactMatch = false, onChangeText, value, ...textInputProps },
    ref,
  ) {
    const hasValue = `${value ?? ""}`.length > 0;

    return (
      <View style={[styles.container, hasExactMatch && styles.exactMatch]}>
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={modalTheme.control.placeholderText}
          style={styles.input}
          {...textInputProps}
        />
        {hasValue && onChangeText !== undefined && (
          <Pressable
            accessibilityRole="button"
            onPress={() => onChangeText("")}
            style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}
          >
            <Text selectable={false} style={styles.clearText}>
              x
            </Text>
          </Pressable>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  clearButton: {
    alignItems: "center",
    alignSelf: "stretch",
    justifyContent: "center",
    minWidth: 32,
  },
  clearText: {
    color: modalTheme.sheet.closeIcon,
    fontSize: 16,
    fontWeight: "900",
  },
  container: {
    alignItems: "center",
    backgroundColor: modalTheme.control.background,
    borderColor: modalTheme.control.border,
    borderRadius: 3,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    minHeight: 36,
  },
  exactMatch: {
    borderColor: modalTheme.modalChip.tone.active.border,
  },
  input: {
    color: modalTheme.control.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  pressed: {
    opacity: 0.72,
  },
});
