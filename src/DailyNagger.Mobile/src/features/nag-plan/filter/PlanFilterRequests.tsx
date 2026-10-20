import { createRequiredContext } from "@/shared/createRequiredContext";
import type { EventEmitter } from "@/shared/useEventEmitter";

export type PlanFilterRequests = EventEmitter<"open", void>;

export const { Provider: PlanFilterRequestsProvider, useRequiredContext: usePlanFilterRequests } =
  createRequiredContext<PlanFilterRequests>("PlanFilterRequests");
