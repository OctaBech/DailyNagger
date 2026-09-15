import { userMoodOptions } from "@/config";
import type { UserMoodLabel } from "@/models";
import { Pressable, Text, View } from "react-native";
import { moodBarStyles as styles } from "./moodBarStyles";

type MoodButtonRowProps = {
  readonly onMoodPressed: (mood: UserMoodLabel) => void;
  readonly selected: UserMoodLabel | null;
  readonly selectedAt: string | null;
};

export function MoodButtonRow({ onMoodPressed, selected, selectedAt }: MoodButtonRowProps) {
  return (
    <View style={styles.barContainer}>
      {userMoodOptions.map((mood) => {
        const isSelected = mood.label === selected;

        return (
          <View key={mood.label} style={styles.itemContainer}>
            {isSelected && selectedAt !== null && (
              <View style={styles.timeSpace}>
                <Text style={[styles.dateLabel, styles.noSelect]}>{selectedAt}</Text>
              </View>
            )}

            <Pressable onPress={() => onMoodPressed(mood.label)} style={styles.smileySpace}>
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
  );
}
