import { createContext, useContext, type ReactNode } from "react";
import type { AssistantBubble } from "../assistant-bubble";
import type { ParcelFlowEvents } from "../sending";
import type { SpeedDialMenu } from "../screen-dial-menus";
import type { Prettify } from "@/shared";
import type { UserMoodLabel } from "@/models";
import type { StateScreenProps } from "@/components/primitives";

export type AppShellState = Prettify<{
  readonly globalOverlaysAreEnabled: boolean;
  readonly pendingSendingPrompt: StateScreenProps | null;
  readonly sendingEvents: ParcelFlowEvents;
  readonly assistantBubble: AssistantBubble;
  readonly moodBar: {
    readonly selectedMood: UserMoodLabel | null;
    readonly selectedEmoji: string | null;
    readonly selectedAt: string | null;
    readonly select: (mood: UserMoodLabel) => void;
  };
  readonly speedDial: {
    readonly planMenu: SpeedDialMenu;
    readonly editorMenu: SpeedDialMenu;
  };
}>;

const AppShellStateContext = createContext<AppShellState | null>(null);

type AppShellStateProviderProps = {
  readonly value: AppShellState;
  readonly children: ReactNode;
};

export function AppShellStateProvider({ value, children }: AppShellStateProviderProps) {
  return <AppShellStateContext.Provider value={value}>{children}</AppShellStateContext.Provider>;
}

export function useAppShellState(): AppShellState {
  const appShellState = useContext(AppShellStateContext);

  if (appShellState === null) {
    throw new Error("AppShellStateContext is missing.");
  }

  return appShellState;
}


