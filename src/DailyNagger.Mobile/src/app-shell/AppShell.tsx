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
import {
  ScreenPositionHandoffDebug,
  ScreenPositionHandoffProvider,
} from "./screen-position-handoff";
import { appRoutes } from "@/navigation";
import { ModalKeyboardBoundaryProvider } from "./modal-keyboard-boundary";
import { appLayout } from "@/config";

type AppShellProps = {
  children: ReactNode;
};

export const AppShell = ({ children }: AppShellProps) => {
  const { bottom, top } = useSafeAreaInsets();
  const [showMoodBar, setShowMoodBar] = useState(true);
  const appShellState = useAppShellState();
  const path = usePathname();
  const assistantBubbleBottomOffset = Math.max(
    appLayout.assistantBubble.bottom,
    bottom + appLayout.assistantBubble.safeAreaGap,
  );
  const postOfficeStripBottomOffset = appLayout.postOfficeStrip.bottom;
  const moodBarIsVisible = appShellState.globalOverlaysAreEnabled && showMoodBar;
  let baseSpeedDialMenu = emptySpeedDialMenu;

  const hideMoodBar = useCallback(() => {
    setShowMoodBar(false);
  }, []);
  const showMoodBarAgain = useCallback(() => {
    setShowMoodBar(true);
  }, []);

  if (appShellState.globalOverlaysAreEnabled) {
    if (path === appRoutes.plan) {
      baseSpeedDialMenu = appShellState.speedDial.planMenu;
    } else if (path.startsWith(appRoutes.taskLogEditorBase)) {
      baseSpeedDialMenu = appShellState.speedDial.editorMenu;
    }
  }
  const speedDialMenu = useMemo(
    () =>
      hydrateSpeedDialMenu(baseSpeedDialMenu, {
        showMoodBar: showMoodBarAgain,
        showMoodBarIsAvailable: !moodBarIsVisible,
      }),
    [baseSpeedDialMenu, moodBarIsVisible, showMoodBarAgain],
  );

  return (
    <ModalKeyboardBoundaryProvider>
      <ScreenPositionHandoffProvider>
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
            <View
              pointerEvents="box-none"
              style={[styles.moodBarOverlay, { top: top + appLayout.moodBar.topOffset }]}
            >
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
          <SpeedDial menu={speedDialMenu} />
          <ScreenPositionHandoffDebug />
          {appShellState.globalOverlaysAreEnabled ? (
            <AssistantBubble
              bottomOffset={assistantBubbleBottomOffset}
              leftOffset={appLayout.assistantBubble.left}
            />
          ) : null}
        </SafeAreaView>
      </ScreenPositionHandoffProvider>
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
    zIndex: 10,
  },
});

type ShellSpeedDialActions = {
  readonly showMoodBar: () => void;
  readonly showMoodBarIsAvailable: boolean;
};

function hydrateSpeedDialMenu(
  menu: SpeedDialMenu,
  shellActions: ShellSpeedDialActions,
): SpeedDialMenu {
  return {
    items: menu.items.flatMap((item) => {
      if (item.onSelect !== undefined) {
        const { shellAction: _shellAction, ...presentation } = item;
        return [{ ...presentation, onSelect: item.onSelect }];
      }

      if (item.shellAction !== "showMoodBar") return [];
      if (!shellActions.showMoodBarIsAvailable) return [];

      const { shellAction: _shellAction, ...presentation } = item;
      return [{ ...presentation, onSelect: shellActions.showMoodBar }];
    }),
  };
}
