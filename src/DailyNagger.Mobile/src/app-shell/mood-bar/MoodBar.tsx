import type { UserMoodLabel } from "@/models";
import { useEffect, useState } from "react";
import { Platform, ScrollView, View } from "react-native";
import { appLayout } from "@/config";
import { MoodBubbleRow } from "./MoodBubbleRow";
import { MoodButtonRow } from "./MoodButtonRow";
import { moodBarStyles as styles } from "./moodBarStyles";

type MoodBarProps = {
  readonly visible: boolean;
  readonly onSelect: (mood: UserMoodLabel) => void;
  readonly onSelectionFeedbackHidden?: () => void;
  readonly selected: UserMoodLabel | null;
  readonly selectedAt: string | null;
};

export const MoodBar = (props: MoodBarProps) => {
  const { visible, selected, onSelect, onSelectionFeedbackHidden, selectedAt } = props;
  const [bubbleVisibility, setBubbleVisibility] = useState({ token: 0, visible: false });

  useEffect(() => {
    if (!bubbleVisibility.visible) return;

    const timeoutId = setTimeout(() => {
      setBubbleVisibility((current) =>
        current.token === bubbleVisibility.token ? { ...current, visible: false } : current,
      );
      onSelectionFeedbackHidden?.();
    }, appLayout.moodBar.bubbleVisibleMs);

    return () => clearTimeout(timeoutId);
  }, [bubbleVisibility.token, bubbleVisibility.visible, onSelectionFeedbackHidden]);

  function selectMood(mood: UserMoodLabel): void {
    setBubbleVisibility(({ token }) => ({ token: token + 1, visible: true }));
    onSelect(mood);
  }

  if (!visible) return <></>;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={Platform.OS === "web"}>
      <View style={styles.headerContainer}>
        <MoodButtonRow selected={selected} selectedAt={selectedAt} onMoodPressed={selectMood} />
        {bubbleVisibility.visible && <MoodBubbleRow selected={selected} />}
      </View>
    </ScrollView>
  );
};
