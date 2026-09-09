import { createRequiredContext, type Prettify } from "@/shared";
import type { RegisteredActionClient, planScreenActionRegistry } from "@/services/action-boundary";
import { useMemo } from "react";

export type PlanScreenCommands = Prettify<ReturnType<typeof useCreatePlanScreenCommands>>;

export const { Provider: PlanScreenCommandsProvider, useRequiredContext: usePlanScreenCommands } =
  createRequiredContext<PlanScreenCommands>("PlanScreenCommandsContext");

type UseCreatePlanScreenCommandsProps = {
  readonly registeredActions: RegisteredActionClient<typeof planScreenActionRegistry>;
};

export function useCreatePlanScreenCommands({ registeredActions }: UseCreatePlanScreenCommandsProps) {
  return useMemo(
    () => ({
      dial: registeredActions.dial,
      nagger: registeredActions.nagger,
      taskEntry: registeredActions.taskEntry,
      taskItem: registeredActions.taskItem,
      taskLog: registeredActions.taskLog,
    }),
    [registeredActions],
  );
}
