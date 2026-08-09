import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from "react";
import type { Memory, Startup, UserMoodState } from "../contracts";
import type { UserMoodLabel } from "@/models";
import type { Prettify } from "@/shared";
import { selectedPathOperations } from "../core-tree-operations";

type UseCreatePlanScreenDataProps = {
  readonly planMemory: Memory;
  readonly startup: Startup;
  readonly userMood: UserMoodState;
  readonly selectMood: (mood: UserMoodLabel) => void;
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
  selectMood,
}: UseCreatePlanScreenDataProps) {
  const { selectedPath, tree } = planMemory.state;
  const { options, state } = userMood;
  const { selectedAt, selectedMood } = state;
  const scrollOffsetRef = useRef(0);

  const getScrollOffset = useCallback(() => scrollOffsetRef.current, []);
  const setScrollOffset = useCallback((offset: number) => {
    scrollOffsetRef.current = offset;
  }, []);

  return useMemo(
    () => ({
      nags: tree?.nags ?? [],
      selectedPath,
      selectedNodes: selectedPathOperations.deriveSelectedNodes(selectedPath),
      startup,
      scroll: {
        getOffset: getScrollOffset,
        setOffset: setScrollOffset,
      },
      mood: {
        options,
        selectedMood,
        selectedAt,
        select: selectMood,
      },
    }),
    [
      getScrollOffset,
      options,
      selectMood,
      selectedAt,
      selectedMood,
      selectedPath,
      setScrollOffset,
      startup,
      tree,
    ],
  );
}
