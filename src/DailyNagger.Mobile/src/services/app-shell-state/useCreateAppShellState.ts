import { useCallback, useMemo } from "react";
import { useRouter } from "expo-router";
import type { Memory, Startup } from "../contracts";
import type { AssistantBubble } from "../assistant-bubble";
import type { ParcelFlowEvents, Sending } from "../sending";
import type { EditorScreenActions, PlanScreenActions } from "../screen-actions";
import type {
  editorDialActionRegistry,
  planDialActionRegistry,
  JsxActionPack,
} from "@/services/action-boundary";
import {
  useCreateEditorScreenDialMenu,
  useCreatePlanScreenDialMenu,
  type SpeedDialMenu,
} from "../screen-dial-menus";
import type { UserMoodState } from "../user-mood";
import { treeSelection, type UserMoodLabel } from "@/models";
import { getUserMoodEmoji, userMoodConfig } from "@/config";
import { appRoutes } from "@/navigation";
import type { Guid } from "@/shared";
import type { StateScreenProps } from "@/components/primitives";

type UseCreateAppShellStateProps = {
  readonly assistantBubble: AssistantBubble;
  readonly editorDialJsxActions: JsxActionPack<typeof editorDialActionRegistry>["dial"];
  readonly editorMemory: Memory;
  readonly editorScreenCommands: EditorScreenActions;
  readonly planDialJsxActions: JsxActionPack<typeof planDialActionRegistry>["dial"];
  readonly planMemory: Memory;
  readonly planScreenCommands: PlanScreenActions;
  readonly sending: Sending;
  readonly sendingEvents: ParcelFlowEvents;
  readonly startup: Startup;
  readonly selectMood: (mood: UserMoodLabel) => void;
  readonly userMood: UserMoodState;
};

export function useCreateAppShellState({
  assistantBubble,
  editorDialJsxActions,
  editorMemory,
  editorScreenCommands,
  planDialJsxActions,
  planMemory,
  planScreenCommands,
  sending,
  sendingEvents,
  startup,
  selectMood,
  userMood,
}: UseCreateAppShellStateProps) {
  const router = useRouter();

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

  const planSelectedPath = planMemory.state.selectedPath;
  const planSelectedNodes = useMemo(
    () => treeSelection.deriveSelectedNodes(planSelectedPath),
    [planSelectedPath],
  );
  const editorSelectedPath = editorMemory.state.selectedPath;
  const editorSelectedNodes = useMemo(
    () => treeSelection.deriveSelectedNodes(editorSelectedPath),
    [editorSelectedPath],
  );
  const selectedMoodEmoji = getUserMoodEmoji(userMood.state.selectedMood);
  const planSpeedDialMenu = useCreatePlanScreenDialMenu({
    planDialJsxActions,
    actionsAreAvailable: startup.isReady && userMood.state.selectedMood !== null,
    selectedNodes: planSelectedNodes,
    selectedPath: planSelectedPath,
    onCreateNagger: createNagger,
    onEditNagger: editNagger,
  });
  const editorSpeedDialMenu = useCreateEditorScreenDialMenu({
    editorDialJsxActions,
    selectedNodes: editorSelectedNodes,
    selectedPath: editorSelectedPath,
    onCloseEditor: closeEditor,
  });
  const planSpeedDialMenuWithShellActions = useMemo(
    () => addMoodBarSpeedDialAction(planSpeedDialMenu, selectedMoodEmoji),
    [planSpeedDialMenu, selectedMoodEmoji],
  );
  const editorSpeedDialMenuWithShellActions = useMemo(
    () => addMoodBarSpeedDialAction(editorSpeedDialMenu, selectedMoodEmoji),
    [editorSpeedDialMenu, selectedMoodEmoji],
  );
  const pendingSendingPrompt = createPendingSendingPrompt(sending);

  return useMemo(
    () => ({
      globalOverlaysAreEnabled: !startup.hasBlockingState,
      pendingSendingPrompt,
      sendingEvents,
      assistantBubble,
      moodBar: {
        selectedMood: userMood.state.selectedMood,
        selectedEmoji: selectedMoodEmoji,
        selectedAt: userMood.state.selectedAt,
        select: selectMood,
      },
      speedDial: {
        planMenu: planSpeedDialMenuWithShellActions,
        editorMenu: editorSpeedDialMenuWithShellActions,
      },
    }),
    [
      assistantBubble,
      editorSpeedDialMenuWithShellActions,
      planSpeedDialMenuWithShellActions,
      pendingSendingPrompt,
      selectMood,
      sendingEvents,
      startup.hasBlockingState,
      userMood.state.selectedAt,
      userMood.state.selectedMood,
      selectedMoodEmoji,
    ],
  );
}

function createPendingSendingPrompt(sending: Sending): StateScreenProps | null {
  const prompt = sending.pendingSendingPrompt.state;
  if (prompt === null) return null;

  return {
    title: prompt.title,
    message: prompt.message,
    detail: __DEV__ ? prompt.technicalMessage : undefined,
    primaryAction: {
      label: prompt.primaryActionLabel,
      accessibilityLabel: prompt.primaryActionLabel,
      onPress: sending.pendingSendingPrompt.accept,
    },
    secondaryAction:
      prompt.secondaryActionLabel === undefined
        ? undefined
        : {
            label: prompt.secondaryActionLabel,
            accessibilityLabel: prompt.secondaryActionLabel,
            kind: "secondary",
            onPress: sending.pendingSendingPrompt.chooseSecondaryAction,
          },
  };
}

function addMoodBarSpeedDialAction(
  menu: SpeedDialMenu,
  selectedMoodEmoji: string | null,
): SpeedDialMenu {
  return {
    items: [
      ...menu.items,
      {
        key: "shell.show-mood-bar",
        iconType: "emoji",
        iconValue: selectedMoodEmoji ?? userMoodConfig.unknownMoodEmoji,
        label: "Mood",
        showLabel: true,
        row: 4,
      },
    ],
  };
}






