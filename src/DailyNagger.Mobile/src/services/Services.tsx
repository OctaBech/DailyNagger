import { useCallback, useRef, type ReactNode } from "react";
import { useCultureSettings } from "./culture";
import { type MemoryEventType, useMemory, useSelectionMemory } from "./memory";
import { useLoading } from "./loading";
import { type Parcel, type SendingEventType, useSending } from "./sending";
import { useSelectUserMood, useUserMoodState } from "./user-mood";
import { useInteractionStamp } from "./interaction-stamp";
import { useAssistantBubble } from "./assistant-bubble";
import {
  EditorScreenActionsProvider,
  type EditorScreenActions,
  PlanScreenActionsProvider,
  useCreateEditorScreenActions,
  useCreatePlanScreenActions,
  type PlanScreenActions,
} from "./screen-actions";
import {
  editorDialActionRegistry,
  editorScreenActionRegistry,
  type ActionExecutionEvent,
  type ActionExecutionEventType,
  planDialActionRegistry,
  planScreenActionRegistry,
  useRegisteredActions,
} from "./action-boundary";
import type { UserMoodLabel } from "@/models";
import { useDailyNaggerObservability } from "@/observability";
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
      <PlanScreenActionsProvider value={planScreenCommands}>
        <EditorScreenActionsProvider value={editorScreenCommands}>
          <PlanScreenDataProvider value={planScreenData}>
            <EditorScreenDataProvider value={editorScreenData}>{children}</EditorScreenDataProvider>
          </PlanScreenDataProvider>
        </EditorScreenActionsProvider>
      </PlanScreenActionsProvider>
    </AppShellStateProvider>
  );
};

function useCreateServices(): {
  readonly appShellState: AppShellState;
  readonly editorScreenCommands: EditorScreenActions;
  readonly planScreenCommands: PlanScreenActions;
  readonly planScreenData: PlanScreenData;
  readonly editorScreenData: EditorScreenData;
} {
  // Wiring internal service communication
  const cultureSettings = useCultureSettings();
  const planMemoryEvents = useEventEmitter<MemoryEventType, void>();
  const editorMemoryEvents = useEventEmitter<MemoryEventType, void>();
  const actionEvents = useEventEmitter<ActionExecutionEventType, ActionExecutionEvent>();
  const rawPlanMemory = useMemory();
  const planMemory = useSelectionMemory(rawPlanMemory, "planMemory", planMemoryEvents);
  const rawEditorMemory = useMemory();
  const editorMemory = useSelectionMemory(rawEditorMemory, "editorMemory", editorMemoryEvents);

  const sendingEvents = useEventEmitter<SendingEventType, readonly Parcel[]>();
  useDailyNaggerObservability({
    actionEvents,
    editorMemoryEvents,
    planMemoryEvents,
    sendingEvents,
  });
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
    cultureSettings,
    planMemory,
    startup,
    userMood,
  });
  const editorScreenData = useCreateEditorScreenData({ editorMemory, cultureSettings });
  const planRegisteredActions = useRegisteredActions(planScreenActionRegistry, {
    cultureSettings,
    editorMemory,
    planInteractionStamp: interactionStamp,
    planMemory,
    actionEvents,
    sending,
    screen: "plan",
  });
  const planDialJsxActions = useRegisteredActions(planDialActionRegistry, {
    cultureSettings,
    editorMemory,
    planInteractionStamp: interactionStamp,
    planMemory,
    actionEvents,
    sending,
    screen: "plan",
  }).dial;
  const editorRegisteredActions = useRegisteredActions(editorScreenActionRegistry, {
    cultureSettings,
    editorMemory,
    planInteractionStamp: interactionStamp,
    planMemory,
    actionEvents,
    sending,
    screen: "editor",
  });
  const editorDialJsxActions = useRegisteredActions(editorDialActionRegistry, {
    cultureSettings,
    editorMemory,
    planInteractionStamp: interactionStamp,
    planMemory,
    actionEvents,
    sending,
    screen: "editor",
  }).dial;
  const planScreenCommands = useCreatePlanScreenActions({
    registeredActions: planRegisteredActions,
  });
  const editorScreenCommands = useCreateEditorScreenActions({
    registeredActions: editorRegisteredActions,
  });
  const appShellState = useCreateAppShellState({
    assistantBubble,
    editorDialJsxActions,
    editorMemory,
    editorScreenCommands,
    planDialJsxActions,
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
