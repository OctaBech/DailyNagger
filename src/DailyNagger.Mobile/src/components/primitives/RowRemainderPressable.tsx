import { Pressable, StyleSheet } from "react-native";

type RowRemainderPressableProps = {
  readonly accessibilityLabel: string;
  readonly minHeight?: number;
  readonly onPress?: () => void;
};

export const RowRemainderPressable = ({
  accessibilityLabel,
  minHeight = 30,
  onPress,
}: RowRemainderPressableProps) => {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={[styles.pressable, { minHeight }]}
    />
  );
};

const styles = StyleSheet.create({
  pressable: {
    alignSelf: "stretch",
    flex: 1,
  },
});
