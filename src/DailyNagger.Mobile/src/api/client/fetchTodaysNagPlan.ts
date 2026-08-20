import type { NagPlanDto } from "@/api/dto";
import { environment } from "@/config";
import { apiRequest } from "./apiRequest";

export class TodaysNagPlanPreparingError extends Error {
  constructor() {
    super("Todays nagger plan is preparing.");
  }
}

export async function fetchTodaysNagPlan(): Promise<NagPlanDto> {
  const today = new Date().toISOString().slice(0, 10);

  const query = new URLSearchParams({
    communityId: environment.communityId,
    userId: environment.userId,
    date: today,
  });

  const result = await apiRequest<NagPlanDto>({
    method: "GET",
    path: `/api/todays-nag-plan?${query}`,
  });

  if (result.kind === "accepted") {
    throw new TodaysNagPlanPreparingError();
  }

  if (result.kind !== "ok") {
    throw new Error("Todays nagger plan response had no JSON body.");
  }

  return result.body;
}
