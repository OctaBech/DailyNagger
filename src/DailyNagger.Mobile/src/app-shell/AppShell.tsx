import { StatusBar } from "expo-status-bar";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, StyleSheet, View } from "react-native";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "expo-router";
import { AssistantBubble } from "./assistant-bubble";
import { MoodBar } from "./mood-bar";
import { PostOfficeStrip } from "./post-office-strip";
import { useAppShellState } from "@/services";
import { SpeedDial, createDialMenuBuilder, emptySpeedDialMenu } from "@/components/speed-dial";
import {
  ScreenPositionHandoffDebug,
  ScreenPositionHandoffProvider,
} from "./screen-position-handoff";
import { appRoutes } from "@/navigation";
import { ModalKeyboardBoundaryProvider } from "./modal-keyboard-boundary";
import { appLayout, debugConfig, userMoodConfig } from "@/config";
import { SendingPromptOverlay } from "./sending-prompt";
import { useEventEmitter } from "@/shared/useEventEmitter";
import { PlanFilterRequestsProvider } from "@/features/nag-plan/list/filter/PlanFilterRequests";

type AppShellProps = {
  children: ReactNode;
};

export const AppShell = ({ children }: AppShellProps) => {
  const { bottom, top } = useSafeAreaInsets();
  const [showMoodBar, setShowMoodBar] = useState(true);
  const appShellState = useAppShellState();
  const planFilterRequests = useEventEmitter<"open", void>();
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
  const speedDialMenu = useMemo(() => {
    const builder = createDialMenuBuilder(baseSpeedDialMenu.items);
    if (
      path === appRoutes.plan &&
      appShellState.speedDial.planActionsAreAvailable &&
      appShellState.globalOverlaysAreEnabled
    ) {
      builder.addOption({
        row: "new",
        key: "plan.show-filter",
        iconType: "vector",
        iconValue: "magnify",
        label: "Filter tasks",
        showLabel: true,
        onSelect: () => planFilterRequests.emit("open", undefined),
      });
    }
    if (
      !moodBarIsVisible &&
      appShellState.globalOverlaysAreEnabled &&
      (path === appRoutes.plan || path.startsWith(appRoutes.taskLogEditorBase))
    ) {
      builder.addOption({
        row: "new",
        key: "shell.show-mood-bar",
        iconType: "emoji",
        iconValue: appShellState.moodBar.selectedEmoji ?? userMoodConfig.unknownMoodEmoji,
        label: "Mood",
        showLabel: true,
        onSelect: showMoodBarAgain,
      });
    }
    return { items: builder.getMenuArray() };
  }, [
    baseSpeedDialMenu,
    moodBarIsVisible,
    path,
    planFilterRequests,
    appShellState.speedDial.planActionsAreAvailable,
    appShellState.globalOverlaysAreEnabled,
    appShellState.moodBar.selectedEmoji,
    showMoodBarAgain,
  ]);

  return (
    <PlanFilterRequestsProvider value={planFilterRequests}>
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
                  selected={appShellState.moodBar.selectedMood}
                  selectedAt={appShellState.moodBar.selectedAt}
                  onSelect={appShellState.moodBar.select}
                  onSelectionFeedbackHidden={hideMoodBar}
                />
              </View>
            ) : null}
            <SendingPromptOverlay prompt={appShellState.pendingSendingPrompt} />
            <SpeedDial menu={speedDialMenu} />
            {debugConfig.showScreenPosition && <ScreenPositionHandoffDebug />}
            {appShellState.globalOverlaysAreEnabled ? (
              <AssistantBubble
                bottomOffset={assistantBubbleBottomOffset}
                leftOffset={appLayout.assistantBubble.left}
              />
            ) : null}
          </SafeAreaView>
        </ScreenPositionHandoffProvider>
      </ModalKeyboardBoundaryProvider>
    </PlanFilterRequestsProvider>
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
