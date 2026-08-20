import { StyleSheet, View } from "react-native";
import { MoodBar } from "@/app-shell";
import { Primitives } from "@/components";
import { appLayout } from "@/config";
import { nagPlanTheme } from "./theme";
import { NagList } from "./NagList";
import { usePlanScreenData } from "@/services";

export const NagPlanScreen = () => {
  const { mood, nags, scroll, startup } = usePlanScreenData();
  const showMoodBar = !startup.hasBlockingState;

  return (
    <View style={styles.screen}>
      {startup.hasBlockingState && startup.stateScreenProps !== null ? (
        <Primitives.StateScreen {...startup.stateScreenProps} />
      ) : !startup.isReady ? (
        <Primitives.StateScreen
          title="Starting DailyNagger"
          message="DailyNagger is getting ready."
          showSpinner
        />
      ) : mood.selectedMood === null ? null : (
        <NagList nags={nags} getScrollOffset={scroll.getOffset} setScrollOffset={scroll.setOffset} />
      )}
      {showMoodBar ? (
        <View pointerEvents="box-none" style={styles.moodBarOverlay}>
          <MoodBar
            visible
            options={mood.options}
            selected={mood.selectedMood}
            selectedAt={mood.selectedAt}
            onSelect={mood.select}
          />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: nagPlanTheme.screen.background,
    flex: 1,
  },
  moodBarOverlay: {
    left: 0,
    position: "absolute",
    right: 0,
    top: appLayout.moodBar.topOffset,
    zIndex: 10,
  },
});
