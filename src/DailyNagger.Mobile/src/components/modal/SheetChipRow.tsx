import type { ReactNode } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { modalTheme } from "./theme";

type SheetChipRowProps = {
  readonly children: ReactNode;
};

export function SheetChipRow({ children }: SheetChipRowProps) {
  return (
    <ScrollView
      horizontal
      keyboardShouldPersistTaps="handled"
      showsHorizontalScrollIndicator={false}
      style={styles.row}
      contentContainerStyle={styles.content}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: "center",
    flexDirection: "row",
    gap: modalTheme.modalChipRow.gap,
    paddingHorizontal: modalTheme.sheet.contentPaddingHorizontal,
  },
  row: {
    marginHorizontal: -modalTheme.sheet.contentPaddingHorizontal,
  },
});
