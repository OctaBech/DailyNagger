import { Pressable, StyleSheet, Text, View } from "react-native";
import { checkmarkGlyph } from "./checkmarkGlyph";

type TaskItemCheckmarkProps = {
  readonly checked: boolean;
  readonly onPress?: () => void;
  readonly isMuted?: boolean;
  readonly shape?: "circle" | "square";
};

export const TaskItemCheckmark = ({
  checked,
  isMuted = false,
  onPress,
  shape = "square",
}: TaskItemCheckmarkProps) => {
  const shapeStyle = shape === "circle" ? styles.circleBox : styles.squareBox;

  if (onPress !== undefined) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.box,
          shapeStyle,
          isMuted && styles.readonlyBox,
          checked && styles.checkedBox,
          checked && isMuted && styles.readonlyCheckedBox,
          pressed && styles.pressedBox,
        ]}
      >
        {checked && <Text style={styles.checkedMark}>{checkmarkGlyph}</Text>}
      </Pressable>
    );
  }

  return (
    <View
      style={[styles.box, shapeStyle, styles.readonlyBox, checked && styles.readonlyCheckedBox]}
    >
      {checked && <Text style={styles.checkedMark}>{checkmarkGlyph}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fffaf3",
    borderColor: "#1d2428",
    borderWidth: 2,
    height: 16,
    width: 16,
  },
  circleBox: {
    borderRadius: 10,
  },
  squareBox: {
    borderRadius: 1,
  },
  checkedBox: {
    borderColor: "#1d2428",
  },
  readonlyBox: {
    borderColor: "#55636a",
    opacity: 0.62,
  },
  readonlyCheckedBox: {
    borderColor: "#55636a",
  },
  pressedBox: {
    opacity: 0.7,
  },
  checkedMark: {
    color: "#287211",
    fontSize: 20,
    fontWeight: "100",
    height: 30,
    width: 30,
    left: -6,
    top: -12,
    lineHeight: 28,
    position: "absolute",
    textAlign: "center",
    textAlignVertical: "center",
  },
});
