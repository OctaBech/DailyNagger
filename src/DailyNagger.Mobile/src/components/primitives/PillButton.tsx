import { Pressable, StyleSheet, Text } from "react-native";

type PillButtonProps = {
  readonly label: string;
  readonly isEmpty?: boolean;
  readonly isActive?: boolean;
  readonly showOutline?: boolean;
  readonly onPress?: () => void;
};

export function PillButton({
  label,
  isEmpty = false,
  isActive = false,
  showOutline = false,
  onPress,
}: PillButtonProps) {
  return (
    <Pressable onPress={onPress}>
      <Text
        selectable={false}
        numberOfLines={1}
        style={[
          styles.pill,
          isEmpty && styles.emptyPill,
          showOutline && styles.outlinedPill,
          isActive && styles.activePill,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: "#e2dcf3",
    borderColor: "#9fb7c3",
    borderRadius: 10,
    color: "#243947",
    fontSize: 14,
    fontWeight: "900",
    maxWidth: 64,
    minWidth: 42,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 5,
    textAlign: "center",
  },
  emptyPill: {
    color: "#7f929d",
    opacity: 0.64,
  },
  outlinedPill: {
    borderColor: "#9fb7c3",
    borderRadius: 10,
    borderStyle: "dashed",
    borderWidth: 2,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  activePill: {
    borderColor: "#18242b",
    borderStyle: "solid",
  },
});
