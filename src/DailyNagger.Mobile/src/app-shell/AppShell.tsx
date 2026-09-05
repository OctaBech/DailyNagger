import { StatusBar } from "expo-status-bar";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, StyleSheet, View } from "react-native";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "expo-router";
import { AssistantBubble } from "./assistant-bubble";
import { MoodBar } from "./mood-bar";
import { PostOfficeStrip } from "./post-office-strip";
import { emptySpeedDialMenu, type SpeedDialMenu, useAppShellState } from "@/services";
import { SpeedDial } from "./speed-dial";
import { appRoutes } from "@/navigation";
import { ModalKeyboardBoundaryProvider } from "./modal-keyboard-boundary";
import { appLayout } from "@/config";

type AppShellProps = {
  children: ReactNode;
};

export const AppShell = ({ children }: AppShellProps) => {
  const { bottom } = useSafeAreaInsets();
  const [showMoodBar, setShowMoodBar] = useState(true);
  const appShellState = useAppShellState();
  const path = usePathname();
  const assistantBubbleBottomOffset = Math.max(
    appLayout.assistantBubble.bottom,
    bottom + appLayout.assistantBubble.safeAreaGap,
  );
  const postOfficeStripBottomOffset = appLayout.postOfficeStrip.bottom;
  const moodBarIsVisible = appShellState.globalOverlaysAreEnabled && showMoodBar;
  let speedDialMenu = emptySpeedDialMenu;

  const hideMoodBar = useCallback(() => {
    setShowMoodBar(false);
  }, []);
  const showMoodBarAgain = useCallback(() => {
    setShowMoodBar(true);
  }, []);

  if (appShellState.globalOverlaysAreEnabled) {
    if (path === appRoutes.plan) {
      speedDialMenu = appShellState.speedDial.planMenu;
    } else if (path.startsWith(appRoutes.taskLogEditorBase)) {
      speedDialMenu = appShellState.speedDial.editorMenu;
    }
  }
  const speedDialMenuWithShellActions = useMemo(
    () =>
      addShellSpeedDialActions(
        speedDialMenu,
        showMoodBarAgain,
        appShellState.moodBar.selectedEmoji,
        moodBarIsVisible,
      ),
    [appShellState.moodBar.selectedEmoji, moodBarIsVisible, showMoodBarAgain, speedDialMenu],
  );

  return (
    <ModalKeyboardBoundaryProvider>
      <SafeAreaView style={styles.container}>
        {Platform.OS === "android" ? null : <StatusBar style="auto" />}
        {children}
        {appShellState.globalOverlaysAreEnabled ? (
          <PostOfficeStrip
            sendingEvents={appShellState.sendingEvents}
            bottomOffset={postOfficeStripBottomOffset}
          />
        ) : null}
        {moodBarIsVisible ? (
          <View pointerEvents="box-none" style={styles.moodBarOverlay}>
            <MoodBar
              visible
              options={appShellState.moodBar.options}
              selected={appShellState.moodBar.selectedMood}
              selectedAt={appShellState.moodBar.selectedAt}
              onSelect={appShellState.moodBar.select}
              onSelectionFeedbackHidden={hideMoodBar}
            />
          </View>
        ) : null}
        <SpeedDial menu={speedDialMenuWithShellActions} />
        {appShellState.globalOverlaysAreEnabled ? (
          <AssistantBubble
            bottomOffset={assistantBubbleBottomOffset}
            leftOffset={appLayout.assistantBubble.left}
          />
        ) : null}
      </SafeAreaView>
    </ModalKeyboardBoundaryProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1b1d",
  },
  moodBarOverlay: {
    left: 0,
    position: "absolute",
    right: 0,
    top: appLayout.moodBar.topOffset,
    zIndex: 10,
  },
});

function addShellSpeedDialActions(
  menu: SpeedDialMenu,
  showMoodBar: () => void,
  selectedMoodEmoji: string | null,
  moodBarIsVisible: boolean,
): SpeedDialMenu {
  if (moodBarIsVisible) return menu;

  return {
    items: [
      ...menu.items,
      {
        key: "shell.show-mood-bar",
        emoji: selectedMoodEmoji ?? "🙂",
        label: "Mood",
        showLabel: true,
        row: 4,
        onSelect: showMoodBar,
      },
    ],
  };
}
