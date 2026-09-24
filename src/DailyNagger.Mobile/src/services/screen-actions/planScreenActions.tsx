import { createRequiredContext, type Prettify } from "@/shared";
import type { JsxActionPack, planScreenActionRegistry } from "@/services/action-boundary";

export type PlanScreenActions = Prettify<JsxActionPack<typeof planScreenActionRegistry>>;

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
