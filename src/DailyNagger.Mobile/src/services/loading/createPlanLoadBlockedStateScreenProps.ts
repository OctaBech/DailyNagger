import { ApiRequestError, TodaysNagPlanPreparingError } from "@/api";
import type { StateScreenProps } from "@/components/primitives";
import { appTiming } from "@/config";

export function createPlanLoadBlockedStateScreenProps(error: unknown): StateScreenProps {
  const technicalMessage = error instanceof Error ? error.message : String(error);

  if (error instanceof TodaysNagPlanPreparingError) {
    return {
      title: "Preparing today's plan",
      message: `DailyNagger is building your new plan. It will try again in ${formatMinutes(appTiming.loading.preparingRetryDelayMs)}.`,
      detail: __DEV__ ? technicalMessage : undefined,
      showSpinner: true,
    };
  }

  if (error instanceof ApiRequestError) {
    if (error.response.status === 404) {
      return {
        title: "Plan not found",
        message: "DailyNagger could not find a plan for today.",
        detail: __DEV__ ? technicalMessage : undefined,
      };
    }

    return {
      title: "Server error",
      message: "DailyNagger reached the server, but the plan could not be loaded.",
      detail: __DEV__ ? technicalMessage : undefined,
    };
  }

  if (error instanceof TypeError) {
    return {
      title: "Server unavailable",
      message:
        "DailyNagger could not connect to the server. Check that the backend is running and try again.",
      detail: __DEV__ ? technicalMessage : undefined,
    };
  }

  return {
    title: "Loading failed",
    message: "DailyNagger could not load the plan.",
    detail: __DEV__ ? technicalMessage : undefined,
  };
}

function formatMinutes(milliseconds: number): string {
  const minutes = Math.max(1, Math.round(milliseconds / 60000));
  return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
}
