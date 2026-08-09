import { StyleSheet, Text } from "react-native";

type ExpandIndicatorProps = {
  readonly isExpanded: boolean;
  readonly hasExpandableContent: boolean;
  readonly color: string;
};

export const ExpandIndicator = ({
  isExpanded,
  hasExpandableContent,
  color,
}: ExpandIndicatorProps) => {
  if (!hasExpandableContent) return null;

  return (
    <Text selectable={false} style={[styles.text, { color }]}>
      {isExpanded ? "v" : ">"}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: 22,
    fontWeight: "800",
  },
});
