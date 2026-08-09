import { StyleSheet, Text } from "react-native";
import { checkmarkGlyph } from "./checkmarkGlyph";

type ProgressCountProps = {
  readonly done: number;
  readonly total: number;
  readonly color: string;
  readonly weight?: "700" | "800";
  readonly hideWhenEmpty?: boolean;
};

export const ProgressCount = ({
  done,
  total,
  color,
  weight = "700",
  hideWhenEmpty = true,
}: ProgressCountProps) => {
  if (hideWhenEmpty && total === 0) return null;

  return (
    <Text selectable={false} style={[styles.text, { color, fontWeight: weight }]}>
      {`${done}/${total}${checkmarkGlyph}`}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
  },
});
