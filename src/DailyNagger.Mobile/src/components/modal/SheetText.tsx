import type { ReactNode } from "react";
import { StyleSheet, Text } from "react-native";
import { modalTheme } from "./theme";

type SheetTextTone = "placeholder" | "status";

type SheetTextProps = {
  readonly children: ReactNode;
  readonly tone: SheetTextTone;
};

export function SheetText({ children, tone }: SheetTextProps) {
  return (
    <Text selectable={false} style={[styles.text, getToneStyle(tone)]}>
      {children}
    </Text>
  );
}

function getToneStyle(tone: SheetTextTone) {
  return {
    color: modalTheme.modalText[tone],
  };
}

const styles = StyleSheet.create({
  text: {
    fontSize: 15,
    fontWeight: "800",
  },
});
