import { StyleSheet, Text } from "react-native";
import { modalTheme } from "./theme";

type SheetHeadlineTone = "active" | "inactive";

type SheetHeadlineProps = {
  readonly text: string;
  readonly tone?: SheetHeadlineTone;
};

export function SheetHeadline({ text, tone = "active" }: SheetHeadlineProps) {
  return (
    <Text
      numberOfLines={1}
      selectable={false}
      style={[styles.headline, tone === "active" ? styles.active : styles.inactive]}
    >
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  active: {
    color: modalTheme.modalHeadline.activeText,
    fontWeight: "900",
  },
  headline: {
    fontSize: modalTheme.modalHeadline.fontSize,
    textAlign: "left",
  },
  inactive: {
    color: modalTheme.modalHeadline.inactiveText,
    fontWeight: "800",
  },
});
