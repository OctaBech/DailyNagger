import { appLayout } from "@/config";
import { StyleSheet } from "react-native";

export const moodBarStyles = StyleSheet.create({
  headerContainer: {
    alignSelf: "center",
    width: "100%",
  },
  barContainer: {
    alignItems: "flex-start",
    alignSelf: "center",
    backgroundColor: appLayout.moodBar.backgroundColor,
    borderColor: appLayout.moodBar.borderColor,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    marginHorizontal: appLayout.moodBar.marginHorizontal,
    paddingHorizontal: appLayout.moodBar.paddingHorizontal,
    paddingVertical: appLayout.moodBar.paddingVertical,
  },
  itemContainer: {
    alignItems: "center",
    flexDirection: "column",
    position: "relative",
    width: appLayout.moodBar.itemWidth,
  },
  timeSpace: {
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: appLayout.moodBar.selectedAtTopOffset,
    width: 100,
  },
  smileySpace: {
    alignItems: "center",
    height: 38,
    justifyContent: "center",
    top: appLayout.moodBar.smileyTopOffset,
  },
  unSelectedSmiley: {
    transform: [{ scale: 1.6 }],
  },
  selectedSmiley: {
    transform: [{ scale: 2.2 }],
  },
  bubbleRow: {
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  bubbleSpace: {
    alignItems: "center",
    height: 42,
    position: "relative",
    width: appLayout.moodBar.itemWidth,
  },
  speechBubbleWrapper: {
    alignItems: "center",
    left: -50,
    position: "absolute",
    top: -8,
    width: 140,
  },
  startBubbleWrapper: {
    alignItems: "flex-start",
    left: -6,
  },
  endBubbleWrapper: {
    alignItems: "flex-end",
    left: -94,
  },
  bubbleArrowUp: {
    backgroundColor: "transparent",
    borderBottomColor: "#333",
    borderBottomWidth: 6,
    borderLeftColor: "transparent",
    borderLeftWidth: 6,
    borderRightColor: "transparent",
    borderRightWidth: 6,
    borderStyle: "solid",
    height: 0,
    width: 0,
  },
  bubbleBody: {
    alignItems: "center",
    backgroundColor: "#333",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  startBubbleArrowUp: {
    marginLeft: 18,
  },
  endBubbleArrowUp: {
    marginRight: 18,
  },
  smileyLabel: {
    color: "#4bc65d",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  dateLabel: {
    color: appLayout.moodBar.dateLabelColor,
    fontSize: 10,
    fontWeight: "500",
    textAlign: "center",
  },
  noSelect: {
    userSelect: "none",
  },
  noPointerEvents: {
    pointerEvents: "none",
  },
});
