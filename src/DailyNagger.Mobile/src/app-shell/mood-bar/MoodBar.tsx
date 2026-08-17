import type { UserMoodLabel, UserMoodOption } from "@/models";
import { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { appLayout } from "@/config";

type MoodBarProps = {
  readonly visible: boolean;
  readonly options: readonly UserMoodOption[];
  readonly onSelect: (mood: UserMoodLabel) => void;
  readonly selected: UserMoodLabel | null;
  readonly selectedAt: string | null;
};

export const MoodBar = (props: MoodBarProps) => {
  const { visible, options, selected, onSelect, selectedAt } = props;
  const [bubbleVisibility, setBubbleVisibility] = useState({ token: 0, visible: false });

  useEffect(() => {
    if (!bubbleVisibility.visible) return;

    const timeoutId = setTimeout(() => {
      setBubbleVisibility((current) =>
        current.token === bubbleVisibility.token ? { ...current, visible: false } : current,
      );
    }, appLayout.moodBar.bubbleVisibleMs);

    return () => clearTimeout(timeoutId);
  }, [bubbleVisibility.token, bubbleVisibility.visible]);

  if (!visible) return <></>;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={Platform.OS === "web"}>
      <View style={styles.headerContainer}>
        <View style={styles.barContainer}>
          {options.map((mood, index) => {
            const isSelected = mood.label === selected;

            return (
              <View key={mood.label} style={styles.itemContainer}>
                {isSelected && selectedAt !== null && (
                  <View style={styles.timeSpace}>
                    <Text style={[styles.dateLabel, styles.noSelect]}>{selectedAt}</Text>
                  </View>
                )}

                <Pressable
                  onPress={() => {
                    setBubbleVisibility(({ token }) => ({ token: token + 1, visible: true }));
                    onSelect(mood.label);
                  }}
                  style={styles.smileySpace}
                >
                  <Text
                    style={[
                      isSelected ? styles.selectedSmiley : styles.unSelectedSmiley,
                      styles.noSelect,
                    ]}
                  >
                    {mood.emoji}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        {bubbleVisibility.visible && (
          <View style={[styles.bubbleRow, styles.noPointerEvents]}>
            {options.map((mood, index) => {
              const isSelected = mood.label === selected;
              const isNearStart = index < 2;
              const isNearEnd = index >= options.length - 2;
              const bubbleTheme = moodBubbleThemes[mood.label];

              return (
                <View key={mood.label} style={styles.bubbleSpace}>
                  {isSelected && (
                    <View
                      style={[
                        styles.speechBubbleWrapper,
                        styles.noPointerEvents,
                        isNearStart && styles.startBubbleWrapper,
                        isNearEnd && styles.endBubbleWrapper,
                      ]}
                    >
                      <View
                        style={[
                          styles.bubbleArrowUp,
                          { borderBottomColor: bubbleTheme.arrowColor },
                          isNearStart && styles.startBubbleArrowUp,
                          isNearEnd && styles.endBubbleArrowUp,
                        ]}
                      />
                      <View style={[styles.bubbleBody, bubbleTheme.body]}>
                        <Text style={[styles.smileyLabel, bubbleTheme.label, styles.noSelect]}>
                          {mood.label}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
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

type MoodBubbleTheme = {
  readonly arrowColor: string;
  readonly body: ViewStyle;
  readonly label: TextStyle;
};

const moodBubbleThemes = {
  "Let's go": {
    arrowColor: "#ffe082",
    body: {
      backgroundColor: "#ffe082",
      borderColor: "#f2b84b",
      borderRadius: 16,
    },
    label: {
      color: "#5a3b00",
      fontFamily: "serif",
      fontSize: 13,
      fontWeight: "900",
    },
  },
  Ouch: {
    arrowColor: "#f4f1ed",
    body: {
      backgroundColor: "#f4f1ed",
      borderColor: "#d85d5d",
      borderRadius: 5,
      borderWidth: 2,
    },
    label: {
      color: "#9b2929",
      fontFamily: "monospace",
      fontSize: 12,
      fontWeight: "800",
    },
  },
  Yawn: {
    arrowColor: "#d8cff0",
    body: {
      backgroundColor: "#d8cff0",
      borderColor: "#a79ac9",
      borderBottomLeftRadius: 18,
      borderBottomRightRadius: 18,
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
    },
    label: {
      color: "#4d416a",
      fontFamily: "serif",
      fontSize: 12,
      fontStyle: "italic",
      fontWeight: "700",
    },
  },
  "Sleep mode": {
    arrowColor: "#b8bec7",
    body: {
      backgroundColor: "#b8bec7",
      borderColor: "#8b929d",
      borderRadius: 18,
      opacity: 0.92,
    },
    label: {
      color: "#28313a",
      fontFamily: "serif",
      fontSize: 12,
      fontStyle: "italic",
      fontWeight: "700",
    },
  },
  "Bathroom break": {
    arrowColor: "#6f4a34",
    body: {
      backgroundColor: "#6f4a34",
      borderColor: "#94613f",
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 8,
      borderTopLeftRadius: 8,
      borderTopRightRadius: 16,
    },
    label: {
      color: "#ffe0ad",
      fontFamily: "monospace",
      fontSize: 12,
      fontWeight: "800",
    },
  },
  "What a world": {
    arrowColor: "#263b6f",
    body: {
      backgroundColor: "#263b6f",
      borderColor: "#6d8ad8",
      borderBottomLeftRadius: 18,
      borderBottomRightRadius: 18,
      borderTopLeftRadius: 6,
      borderTopRightRadius: 18,
    },
    label: {
      color: "#aee6ff",
      fontFamily: "serif",
      fontSize: 13,
      fontWeight: "800",
    },
  },
  "Let's party": {
    arrowColor: "#332048",
    body: {
      backgroundColor: "#332048",
      borderColor: "#e2be57",
      borderRadius: 14,
      borderWidth: 2,
    },
    label: {
      color: "#6cff7d",
      fontSize: 13,
      fontWeight: "900",
      letterSpacing: 0.4,
    },
  },
  "Not sure": {
    arrowColor: "#c9e7ee",
    body: {
      backgroundColor: "#c9e7ee",
      borderColor: "#86b9c7",
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 4,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
    label: {
      color: "#214954",
      fontFamily: "monospace",
      fontSize: 12,
      fontWeight: "800",
    },
  },
  Grrr: {
    arrowColor: "#5b1714",
    body: {
      backgroundColor: "#5b1714",
      borderColor: "#f06148",
      borderBottomLeftRadius: 4,
      borderBottomRightRadius: 14,
      borderTopLeftRadius: 14,
      borderTopRightRadius: 4,
      borderWidth: 2,
    },
    label: {
      color: "#ffcf5f",
      fontFamily: "monospace",
      fontSize: 13,
      fontWeight: "900",
    },
  },
  "Sniffle mode": {
    arrowColor: "#e8eef0",
    body: {
      backgroundColor: "#e8eef0",
      borderColor: "#9db0b7",
      borderRadius: 4,
    },
    label: {
      color: "#4d6068",
      fontSize: 12,
      fontWeight: "800",
    },
  },
  "Fever mode": {
    arrowColor: "#ffb15c",
    body: {
      backgroundColor: "#ffb15c",
      borderColor: "#d45c2c",
      borderBottomLeftRadius: 18,
      borderBottomRightRadius: 6,
      borderTopLeftRadius: 6,
      borderTopRightRadius: 18,
    },
    label: {
      color: "#4e180c",
      fontSize: 13,
      fontWeight: "900",
    },
  },
  Queasy: {
    arrowColor: "#9bbb72",
    body: {
      backgroundColor: "#9bbb72",
      borderColor: "#6f884f",
      borderBottomLeftRadius: 10,
      borderBottomRightRadius: 18,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 10,
    },
    label: {
      color: "#203516",
      fontFamily: "serif",
      fontSize: 12,
      fontStyle: "italic",
      fontWeight: "900",
    },
  },
  "Quiet mode": {
    arrowColor: "#2d3140",
    body: {
      backgroundColor: "#2d3140",
      borderColor: "#797f99",
      borderRadius: 20,
    },
    label: {
      color: "#d9def2",
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.2,
    },
  },
} satisfies Record<UserMoodLabel, MoodBubbleTheme>;
