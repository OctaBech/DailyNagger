import { Pressable, StyleSheet, Text } from "react-native";
import { editableFrame, inactiveEditableFrame } from "./editableFrame";

type PillButtonProps = {
  readonly label: string;
  readonly isEmpty?: boolean;
  readonly isActive?: boolean;
  readonly maxWidth?: number;
  readonly showOutline?: boolean;
  readonly onPress?: () => void;
};

export function PillButton({
  label,
  isEmpty = false,
  isActive = false,
  maxWidth = 64,
  showOutline = false,
  onPress,
}: PillButtonProps) {
  return (
    <Pressable onPress={onPress}>
      <Text
        selectable={false}
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[
          inactiveEditableFrame,
          styles.pill,
          { maxWidth },
          isEmpty && styles.emptyPill,
          showOutline && editableFrame,
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
  activePill: {
    borderColor: "#18242b",
    borderStyle: "solid",
  },
});
