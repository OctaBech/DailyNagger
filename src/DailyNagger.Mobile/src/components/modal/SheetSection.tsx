import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { modalTheme } from "./theme";

type SheetSectionProps = {
  readonly children: ReactNode;
  readonly title?: string;
};

export function SheetSection({ children, title }: SheetSectionProps) {
  return (
    <View style={styles.section}>
      {title === undefined ? null : (
        <Text selectable={false} style={styles.title}>
          {title}
        </Text>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: modalTheme.modalSection.gap,
  },
  title: {
    color: modalTheme.modalSection.titleText,
    fontSize: 15,
    fontWeight: "800",
  },
});
