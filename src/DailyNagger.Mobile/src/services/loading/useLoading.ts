import { fetchTodaysNagPlan } from "@/api";
import type { StateScreenProps } from "@/components/primitives";
import type { Prettify } from "@/shared";
import { useCallback } from "react";
import { importLoadedPlanToMemory } from "../actions";
import type { Memory } from "../memory";
import { createPlanLoadBlockedStateScreenProps } from "./createPlanLoadBlockedStateScreenProps";

export type Loading = Prettify<ReturnType<typeof useLoading>>;

type LoadPlanResult =
  | { readonly kind: "loaded" }
  | { readonly kind: "blocked"; readonly stateScreenProps: StateScreenProps };

export function useLoading(memory: Memory) {
  const loadPlan = useCallback(async (): Promise<LoadPlanResult> => {
    try {
      const fetched = await fetchTodaysNagPlan();
      importLoadedPlanToMemory(memory, fetched);

      return { kind: "loaded" };
    } catch (error) {
      return {
        kind: "blocked",
        stateScreenProps: createPlanLoadBlockedStateScreenProps(error),
      };
    }
  }, [memory]);

  return {
    loadPlan,
  };
}
