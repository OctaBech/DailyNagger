import { forwardRef } from "react";
import { StyleSheet, TextInput, type TextInputProps } from "react-native";
import { modalTheme } from "./theme";

type SheetTextAreaProps = Omit<TextInputProps, "multiline" | "style">;

export const SheetTextArea = forwardRef<TextInput, SheetTextAreaProps>(function SheetTextArea(
  { placeholderTextColor, ...textInputProps },
  ref,
) {
  return (
    <TextInput
      ref={ref}
      multiline
      placeholderTextColor={placeholderTextColor ?? modalTheme.control.placeholderText}
      style={styles.input}
      textAlignVertical="top"
      {...textInputProps}
    />
  );
});

const styles = StyleSheet.create({
  input: {
    backgroundColor: modalTheme.control.background,
    borderColor: modalTheme.control.border,
    borderRadius: 3,
    borderWidth: 1,
    color: modalTheme.control.text,
    fontSize: 14,
    fontWeight: "700",
    minHeight: 72,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
});
