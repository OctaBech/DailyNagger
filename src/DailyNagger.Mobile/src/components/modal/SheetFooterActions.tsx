import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { modalTheme } from "./theme";

type SheetFooterActionsProps = {
  readonly children: ReactNode;
  readonly layout?: "end" | "space-between";
};

export function SheetFooterActions({ children, layout = "end" }: SheetFooterActionsProps) {
  return (
    <View style={[styles.actions, layout === "space-between" && styles.spaceBetween]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    alignItems: "center",
    flexDirection: "row",
    gap: modalTheme.modalFooterActions.gap,
    justifyContent: "flex-end",
  },
  spaceBetween: {
    justifyContent: "space-between",
  },
});
