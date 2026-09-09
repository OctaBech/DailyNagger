import { createRequiredContext, type Prettify } from "@/shared";
import type { RegisteredActionClient, planScreenActionRegistry } from "@/services/action-boundary";

export type PlanScreenCommands = Prettify<RegisteredActionClient<typeof planScreenActionRegistry>>;

export const { Provider: PlanScreenCommandsProvider, useRequiredContext: usePlanScreenCommands } =
  createRequiredContext<PlanScreenCommands>("PlanScreenCommandsContext");

type UseCreatePlanScreenCommandsProps = {
  readonly registeredActions: PlanScreenCommands;
};

export function useCreatePlanScreenCommands({
  registeredActions,
}: UseCreatePlanScreenCommandsProps): PlanScreenCommands {
  return registeredActions;
}
