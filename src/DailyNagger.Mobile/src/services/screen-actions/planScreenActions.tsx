import { createRequiredContext, type Prettify } from "@/shared";
import type { RegisteredActionClient, planScreenActionRegistry } from "@/services/action-boundary";

export type PlanScreenActions = Prettify<RegisteredActionClient<typeof planScreenActionRegistry>>;

export const { Provider: PlanScreenActionsProvider, useRequiredContext: usePlanScreenActions } =
  createRequiredContext<PlanScreenActions>("PlanScreenActionsContext");

type UseCreatePlanScreenActionsProps = {
  readonly registeredActions: PlanScreenActions;
};

export function useCreatePlanScreenActions({
  registeredActions,
}: UseCreatePlanScreenActionsProps): PlanScreenActions {
  return registeredActions;
}

