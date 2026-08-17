import { StyleSheet, Text } from "react-native";
import type { ReactNode } from "react";
import { modalTheme } from "./theme";

type SheetTitleProps = {
  readonly children: ReactNode;
};

export function SheetTitle({ children }: SheetTitleProps) {
  return (
    <Text selectable={false} style={styles.title}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: {
    color: modalTheme.control.text,
    flexGrow: 1,
    flexShrink: 1,
    fontSize: 22,
    fontWeight: "900",
  },
});
