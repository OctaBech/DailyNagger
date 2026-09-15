import { userMoodOptions } from "@/config";
import type { UserMoodLabel } from "@/models";
import { Text, View } from "react-native";
import { moodBarStyles as styles } from "./moodBarStyles";

type MoodBubbleRowProps = {
  readonly selected: UserMoodLabel | null;
};

export function MoodBubbleRow({ selected }: MoodBubbleRowProps) {
  return (
    <View style={[styles.bubbleRow, styles.noPointerEvents]}>
      {userMoodOptions.map((mood, index) => {
        const isSelected = mood.label === selected;
        const isNearStart = index < 2;
        const isNearEnd = index >= userMoodOptions.length - 2;
        const bubbleStyle = mood.bubble;

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
                    { borderBottomColor: bubbleStyle.backgroundColor },
                    isNearStart && styles.startBubbleArrowUp,
                    isNearEnd && styles.endBubbleArrowUp,
                  ]}
                />
                <View style={[styles.bubbleBody, bubbleStyle]}>
                  <Text style={[styles.smileyLabel, mood.text, styles.noSelect]}>{mood.label}</Text>
                </View>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
