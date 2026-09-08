import { useCallback, useMemo } from "react";
import { useRouter } from "expo-router";
import type { Memory, Startup } from "../contracts";
import type { AssistantBubble } from "../assistant-bubble";
import type { Parcel, SendingEventType } from "../sending";
import type { EditorScreenCommands, PlanScreenCommands } from "../screen-commands";
import {
  useCreateEditorScreenDialMenu,
  useCreatePlanScreenDialMenu,
  type SpeedDialMenu,
} from "../screen-dial-menus";
import type { UserMoodState } from "../user-mood";
import { treeSelection, type UserMoodLabel } from "@/models";
import { userMoodConfig } from "@/config";
import { appRoutes } from "@/navigation";
import type { EventEmitter, Guid } from "@/shared";

type UseCreateAppShellStateProps = {
  readonly assistantBubble: AssistantBubble;
  readonly editorMemory: Memory;
  readonly editorScreenCommands: EditorScreenCommands;
  readonly planMemory: Memory;
  readonly planScreenCommands: PlanScreenCommands;
  readonly sendingEvents: EventEmitter<SendingEventType, readonly Parcel[]>;
  readonly startup: Startup;
  readonly selectMood: (mood: UserMoodLabel) => void;
  readonly userMood: UserMoodState;
};

export function useCreateAppShellState({
  assistantBubble,
  editorMemory,
  editorScreenCommands,
  planMemory,
  planScreenCommands,
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
  const selectedMoodEmoji =
    userMood.options.find((option) => option.label === userMood.state.selectedMood)?.emoji ?? null;
  const planSpeedDialMenu = useCreatePlanScreenDialMenu({
    planCommands: planScreenCommands,
    actionsAreAvailable: startup.isReady && userMood.state.selectedMood !== null,
    selectedNodes: planSelectedNodes,
    selectedPath: planSelectedPath,
    onCreateNagger: createNagger,
    onEditNagger: editNagger,
  });
  const editorSpeedDialMenu = useCreateEditorScreenDialMenu({
    editorCommands: editorScreenCommands,
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

  return useMemo(
    () => ({
      globalOverlaysAreEnabled: !startup.hasBlockingState,
      sendingEvents,
      assistantBubble,
      moodBar: {
        options: userMood.options,
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
      selectMood,
      sendingEvents,
      startup.hasBlockingState,
      userMood.options,
      userMood.state.selectedAt,
      userMood.state.selectedMood,
      selectedMoodEmoji,
    ],
  );
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
