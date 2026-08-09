import { StyleSheet } from "react-native";

export const cardRowLayout = StyleSheet.create({
  textSlot: {
    flex: 1,
    minWidth: 0,
  },
  textInput: {
    alignSelf: "stretch",
    flex: 1,
    minWidth: 0,
  },
  text: {
    flexShrink: 1,
  },
});
