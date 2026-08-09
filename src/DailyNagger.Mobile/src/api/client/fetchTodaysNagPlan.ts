import type { NagPlanDto } from "@/api/dto";
import { environment } from "@/config";
import { createAuthHeaders } from "./createAuthHeaders";

export class FetchTodaysNagPlanError extends Error {
  constructor(readonly status: number) {
    super(`Failed to fetch todays nagger plan. Status: ${status}`);
  }
}

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

  const response = await fetch(`${environment.apiBaseUrl}/api/todays-nag-plan?${query}`, {
    headers: createAuthHeaders(),
  });

  if (response.status === 202) {
    throw new TodaysNagPlanPreparingError();
  }

  if (!response.ok) {
    throw new FetchTodaysNagPlanError(response.status);
  }

  return await response.json();
}
