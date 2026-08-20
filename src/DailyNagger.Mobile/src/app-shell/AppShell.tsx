import { StatusBar } from "expo-status-bar";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, StyleSheet } from "react-native";
import { useCallback } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "expo-router";
import { AssistantBubble } from "./assistant-bubble";
import { PostOfficeStrip } from "./post-office-strip";
import {
  emptySpeedDialMenu,
  useCreateEditorScreenDialMenu,
  useCreatePlanScreenDialMenu,
  useEditorScreenCommands,
  useEditorScreenData,
  usePlanScreenCommands,
  usePlanScreenData,
  useServices,
} from "@/services";
import { SpeedDial } from "./speed-dial";
import { appRoutes } from "@/navigation";
import type { Guid } from "@/shared";
import { ModalKeyboardBoundaryProvider } from "./modal-keyboard-boundary";
import { appLayout } from "@/config";

type AppShellProps = {
  children: ReactNode;
};

export const AppShell = ({ children }: AppShellProps) => {
  const { bottom } = useSafeAreaInsets();
  const { appShell } = useServices();
  const editorScreenCommands = useEditorScreenCommands();
  const planScreenCommands = usePlanScreenCommands();
  const planScreenData = usePlanScreenData();
  const editorScreenData = useEditorScreenData();
  const path = usePathname();
  const router = useRouter();
  const assistantBubbleBottomOffset = Math.max(
    appLayout.assistantBubble.bottom,
    bottom + appLayout.assistantBubble.safeAreaGap,
  );
  const postOfficeStripBottomOffset = appLayout.postOfficeStrip.bottom;
  const createNagger = useCallback(() => {
    router.replace(appRoutes.newTaskLogEditor);
  }, [router]);

  const editNagger = useCallback(
    (naggerId: Guid) => {
      router.replace(`${appRoutes.taskLogEditorBase}/${naggerId}`);
    },
    [router],
  );

  const closeEditor = useCallback(() => {
    router.replace(appRoutes.plan);
  }, [router]);

  const planScreenDialMenu = useCreatePlanScreenDialMenu({
    planCommands: planScreenCommands,
    planScreenData,
    onCreateNagger: createNagger,
    onEditNagger: editNagger,
  });
  const editorScreenDialMenu = useCreateEditorScreenDialMenu({
    editorCommands: editorScreenCommands,
    editorScreenData,
    onCloseEditor: closeEditor,
  });
  const speedDialMenu =
    path === appRoutes.plan
      ? planScreenDialMenu
      : path.startsWith(appRoutes.taskLogEditorBase)
        ? editorScreenDialMenu
        : emptySpeedDialMenu;

  return (
    <ModalKeyboardBoundaryProvider>
      <SafeAreaView style={styles.container}>
        {Platform.OS === "android" ? null : <StatusBar style="auto" />}
        {children}
        <PostOfficeStrip
          sendingEvents={appShell.sendingEvents}
          bottomOffset={postOfficeStripBottomOffset}
        />
        <SpeedDial menu={speedDialMenu} />
        <AssistantBubble
          bottomOffset={assistantBubbleBottomOffset}
          leftOffset={appLayout.assistantBubble.left}
        />
      </SafeAreaView>
    </ModalKeyboardBoundaryProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1b1d",
  },
});
