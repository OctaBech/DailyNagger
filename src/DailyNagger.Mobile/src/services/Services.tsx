import { useCallback, useRef, type ReactNode } from "react";
import { useCultureSettings } from "./culture";
import { useMemory, useSelectionMemory } from "./memory";
import { useLoading } from "./loading";
import { type Parcel, type SendingEventType, useSending } from "./sending";
import { useSelectUserMood, useUserMoodState } from "./user-mood";
import { useInteractionStamp } from "./interaction-stamp";
import { useAssistantBubble } from "./assistant-bubble";
import {
  EditorScreenCommandsProvider,
  type EditorScreenCommands,
  PlanScreenCommandsProvider,
  useCreateEditorScreenCommands,
  useCreatePlanScreenCommands,
  type PlanScreenCommands,
} from "./screen-commands";
import { useCommandDispatcher } from "./command-boundary";
import {
  planScreenActionRegistry,
  useRegisteredActions,
} from "./action-boundary";
import type { UserMoodLabel } from "@/models";
import { useEventEmitter } from "@/shared";
import { useRollover } from "./rollover";
import { useStartup } from "./startup";
import {
  PlanScreenDataProvider,
  EditorScreenDataProvider,
  useCreatePlanScreenData,
  useCreateEditorScreenData,
  type PlanScreenData,
  type EditorScreenData,
} from "./screen-data";
import {
  AppShellStateProvider,
  type AppShellState,
  useCreateAppShellState,
} from "./app-shell-state";

type ServiceProviderProps = {
  children: ReactNode;
};

export const ServiceProvider = ({ children }: ServiceProviderProps) => {
  const {
    appShellState,
    editorScreenCommands,
    planScreenCommands,
    planScreenData,
    editorScreenData,
  } = useCreateServices();

  return (
    <AppShellStateProvider value={appShellState}>
      <PlanScreenCommandsProvider value={planScreenCommands}>
        <EditorScreenCommandsProvider value={editorScreenCommands}>
          <PlanScreenDataProvider value={planScreenData}>
            <EditorScreenDataProvider value={editorScreenData}>{children}</EditorScreenDataProvider>
          </PlanScreenDataProvider>
        </EditorScreenCommandsProvider>
      </PlanScreenCommandsProvider>
    </AppShellStateProvider>
  );
};

function useCreateServices(): {
  readonly appShellState: AppShellState;
  readonly editorScreenCommands: EditorScreenCommands;
  readonly planScreenCommands: PlanScreenCommands;
  readonly planScreenData: PlanScreenData;
  readonly editorScreenData: EditorScreenData;
} {
  // Wiring internal service communication
  const cultureSettings = useCultureSettings();
  const rawPlanMemory = useMemory();
  const planMemory = useSelectionMemory(rawPlanMemory, "planMemory");
  const rawEditorMemory = useMemory();
  const editorMemory = useSelectionMemory(rawEditorMemory, "editorMemory");

  const sendingEvents = useEventEmitter<SendingEventType, readonly Parcel[]>();
  const assistantBubble = useAssistantBubble(sendingEvents);
  const userMood = useUserMoodState();
  const interactionStamp = useInteractionStamp(cultureSettings, userMood);
  const currentMoodRef = useRef<UserMoodLabel | null>(null);
  const getCurrentMood = useCallback(() => currentMoodRef.current, []);
  const setCurrentMood = useCallback((mood: UserMoodLabel) => {
    currentMoodRef.current = mood;
  }, []);
  const sending = useSending(planMemory, sendingEvents, getCurrentMood);
  const selectMood = useSelectUserMood({
    cultureSettings,
    sending,
    setCurrentMood,
    userMood,
  });

  const rollover = useRollover(cultureSettings, planMemory, editorMemory, sending);

  const loading = useLoading(planMemory);
  const startup = useStartup(sending, loading, rollover);

  const planScreenData = useCreatePlanScreenData({
    planMemory,
    startup,
    userMood,
  });
  const editorScreenData = useCreateEditorScreenData({ editorMemory, cultureSettings });
  const commandDispatcher = useCommandDispatcher({
    cultureSettings,
    planMemory,
    editorMemory,
    planInteractionStamp: interactionStamp,
    sending,
  });
  const planRegisteredActions = useRegisteredActions(planScreenActionRegistry, {
    cultureSettings,
    editorMemory,
    planInteractionStamp: interactionStamp,
    planMemory,
    screen: "plan",
  });
  const planScreenCommands = useCreatePlanScreenCommands({
    decimalSeparator: cultureSettings.isUsingCommaForDecimals ? "," : ".",
    dispatch: commandDispatcher,
    registeredActions: planRegisteredActions,
  });
  const editorScreenCommands = useCreateEditorScreenCommands({ dispatch: commandDispatcher });
  const appShellState = useCreateAppShellState({
    assistantBubble,
    editorMemory,
    editorScreenCommands,
    planMemory,
    planScreenCommands,
    sendingEvents,
    startup,
    selectMood,
    userMood,
  });

  return {
    appShellState,
    editorScreenCommands,
    planScreenCommands,
    planScreenData,
    editorScreenData,
  };
}
