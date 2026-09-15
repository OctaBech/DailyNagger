import { StyleSheet } from "react-native";
import { postOfficeStripConfig } from "@/config";
import { totalSlotCount } from "./postOfficeVisualParcel";

const slotWidth = postOfficeStripConfig.stripWidth / totalSlotCount;

export const postOfficeStripStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    alignSelf: "center",
    borderRadius: 15,
    flexDirection: "row",
    minHeight: 34,
    paddingHorizontal: 8,
    paddingVertical: 4,
    position: "absolute",
    width: postOfficeStripConfig.stripWidth,
  },
  slot: {
    alignItems: "center",
    height: 24,
    justifyContent: "center",
    width: slotWidth,
  },
  symbol: {
    fontSize: 16,
    userSelect: "none",
  },
  parcelSymbol: {
    alignItems: "center",
    height: 24,
    justifyContent: "center",
    position: "relative",
    width: 24,
    zIndex: 1,
  },
  resultSymbol: {
    fontSize: 14,
    position: "absolute",
    right: -4,
    top: 1,
    userSelect: "none",
  },
  postBox: {
    alignItems: "center",
    height: 24,
    justifyContent: "center",
    position: "absolute",
    width: 24,
    zIndex: 0,
  },
  postBoxSymbol: {
    fontSize: 18,
    opacity: 0.62,
    userSelect: "none",
  },
});
