import { StyleSheet, View } from "react-native";
import type { ReactNode } from "react";
import { SheetCloseButton } from "./SheetCloseButton";
import { SheetTitle } from "./SheetTitle";

type SheetHeaderProps = {
  readonly action: ReactNode;
  readonly title: string;
  readonly onDismiss: () => void;
};

export function SheetHeader({ action, title, onDismiss }: SheetHeaderProps) {
  return (
    <View style={styles.header}>
      <SheetTitle>{title}</SheetTitle>
      {action}
      <SheetCloseButton onPress={onDismiss} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
});
