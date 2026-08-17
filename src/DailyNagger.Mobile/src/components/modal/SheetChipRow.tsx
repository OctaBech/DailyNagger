import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { modalTheme } from "./theme";

type SheetChipRowProps = {
  readonly children: ReactNode;
};

export function SheetChipRow({ children }: SheetChipRowProps) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: modalTheme.modalChipRow.gap,
  },
});
