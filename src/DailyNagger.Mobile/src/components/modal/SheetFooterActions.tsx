import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { modalTheme } from "./theme";

type SheetFooterActionsProps = {
  readonly children: ReactNode;
};

export function SheetFooterActions({ children }: SheetFooterActionsProps) {
  return <View style={styles.actions}>{children}</View>;
}

const styles = StyleSheet.create({
  actions: {
    alignItems: "center",
    flexDirection: "row",
    gap: modalTheme.modalFooterActions.gap,
    justifyContent: "flex-end",
  },
});
