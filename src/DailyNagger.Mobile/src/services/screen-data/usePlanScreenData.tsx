import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from "react";
import type { Memory, Startup, UserMoodState } from "../contracts";
import type { Prettify } from "@/shared";

type UseCreatePlanScreenDataProps = {
  readonly planMemory: Memory;
  readonly startup: Startup;
  readonly userMood: UserMoodState;
};

export type PlanScreenData = Prettify<ReturnType<typeof useCreatePlanScreenData>>;

const PlanScreenDataContext = createContext<PlanScreenData | null>(null);

type PlanScreenDataProviderProps = {
  readonly value: PlanScreenData;
  readonly children: ReactNode;
};

export function PlanScreenDataProvider({ value, children }: PlanScreenDataProviderProps) {
  return <PlanScreenDataContext.Provider value={value}>{children}</PlanScreenDataContext.Provider>;
}

export function usePlanScreenData(): PlanScreenData {
  const planScreenData = useContext(PlanScreenDataContext);

  if (planScreenData === null) {
    throw new Error("PlanScreenDataContext is missing.");
  }

  return planScreenData;
}

export function useCreatePlanScreenData({
  planMemory,
  startup,
  userMood,
}: UseCreatePlanScreenDataProps) {
  const { tree } = planMemory.state;
  const scrollOffsetRef = useRef(0);

  const getScrollOffset = useCallback(() => scrollOffsetRef.current, []);
  const setScrollOffset = useCallback((offset: number) => {
    scrollOffsetRef.current = offset;
  }, []);

  return useMemo(
    () => ({
      nags: tree?.nags ?? [],
      startup,
      moodIsSelected: userMood.state.selectedMood !== null,
      scroll: {
        getOffset: getScrollOffset,
        setOffset: setScrollOffset,
      },
    }),
    [getScrollOffset, setScrollOffset, startup, tree, userMood.state.selectedMood],
  );
}
