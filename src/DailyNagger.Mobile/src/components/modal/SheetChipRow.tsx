import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { modalTheme } from "./theme";

type SheetChipRowProps = {
  readonly children: ReactNode;
  readonly scrollToEndOnChange?: boolean;
};

export function SheetChipRow({ children, scrollToEndOnChange = false }: SheetChipRowProps) {
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!scrollToEndOnChange) return;

    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    });
  }, [children, scrollToEndOnChange]);

  return (
    <ScrollView
      ref={scrollViewRef}
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
