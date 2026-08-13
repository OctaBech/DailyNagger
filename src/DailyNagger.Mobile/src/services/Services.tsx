import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from "react";
import { useCultureSettings } from "./culture";
import { useMemory, useSelectionMemory } from "./memory";
import { useLoading } from "./loading";
import { useSending } from "./sending";
import { useUserMoodState } from "./user-mood";
import { useInteractionStamp } from "./interaction-stamp";
import { type AssistantBubble, useAssistantBubble } from "./assistant-bubble";
import {
  EditorScreenCommandsProvider,
  type EditorScreenCommands,
  PlanScreenCommandsProvider,
  useCreateEditorScreenCommands,
  useCreatePlanScreenCommands,
  type PlanScreenCommands,
} from "./screen-commands";
import { useCommandDispatcher } from "./command-boundary";
import type { Prettify } from "@/shared";
import type { UserMoodLabel } from "@/models";
import { useEventEmitter } from "@/shared";
import { useRollover } from "./rollover";
import { useStartup } from "./startup";
import type { Parcel, SendingEventType } from "./sending";
import {
  PlanScreenDataProvider,
  EditorScreenDataProvider,
  useCreatePlanScreenData,
  useCreateEditorScreenData,
  type PlanScreenData,
  type EditorScreenData,
} from "./screen-data";

export type Services = Prettify<{
  readonly appShell: AppShell;
  readonly assistantBubble: AssistantBubble;
}>;

type AppShell = Prettify<{
  readonly sendingEvents: ReturnType<typeof useEventEmitter<SendingEventType, readonly Parcel[]>>;
}>;

const ServiceContext = createContext<Services | null>(null);

export function useServices() {
  const services = useContext(ServiceContext);

  if (services === null) {
    throw new Error("ServiceContext is missing.");
  }

  return services;
}

type ServiceProviderProps = {
  children: ReactNode;
};

export const ServiceProvider = ({ children }: ServiceProviderProps) => {
  const {
    services,
    editorScreenCommands,
    planScreenCommands,
    planScreenData,
    editorScreenData,
  } = useCreateServices();

  return (
    <ServiceContext.Provider value={services}>
      <PlanScreenCommandsProvider value={planScreenCommands}>
        <EditorScreenCommandsProvider value={editorScreenCommands}>
          <PlanScreenDataProvider value={planScreenData}>
            <EditorScreenDataProvider value={editorScreenData}>
              {children}
            </EditorScreenDataProvider>
          </PlanScreenDataProvider>
        </EditorScreenCommandsProvider>
      </PlanScreenCommandsProvider>
    </ServiceContext.Provider>
  );
};

function useCreateServices(): {
  readonly services: Services;
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
  const currentMoodRef = useRef<UserMoodLabel | null>(null);
  const getCurrentMood = useCallback(() => currentMoodRef.current, []);
  const interactionStamp = useInteractionStamp(cultureSettings, userMood);

  const sending = useSending(
    planMemory,
    sendingEvents,
    getCurrentMood,
  );
  const rollover = useRollover(
    cultureSettings,
    planMemory,
    editorMemory,
    sending,
  );

  const loading = useLoading(planMemory);
  const startup = useStartup(sending, loading, rollover);
  const selectMood = useCallback((mood: UserMoodLabel) => {
    const selection = userMood.create({
      mood,
      timeZone: cultureSettings.getUserTimeZone(),
      locale: cultureSettings.getUserLocale(),
    });

    currentMoodRef.current = selection.mood;
    userMood.select(selection);
    sending.queue(selection);
  }, [cultureSettings, sending, userMood]);

  // Wiring jsx screen services
  const appShell = useMemo(
    () => ({
      sendingEvents,
    }),
    [sendingEvents],
  );
  const planScreenData = useCreatePlanScreenData({
    planMemory,
    startup,
    userMood,
    selectMood,
  });
  const editorScreenData = useCreateEditorScreenData({ editorMemory, cultureSettings });
  const commandDispatcher = useCommandDispatcher({
    cultureSettings,
    planMemory,
    editorMemory,
    planInteractionStamp: interactionStamp,
    sending,
  });
  const planScreenCommands = useCreatePlanScreenCommands({
    decimalSeparator: cultureSettings.isUsingCommaForDecimals ? "," : ".",
    dispatch: commandDispatcher,
  });
  const editorScreenCommands = useCreateEditorScreenCommands({ dispatch: commandDispatcher });

  return {
    services: {
      appShell,
      assistantBubble,
    },
    editorScreenCommands,
    planScreenCommands,
    planScreenData,
    editorScreenData,
  };
}
