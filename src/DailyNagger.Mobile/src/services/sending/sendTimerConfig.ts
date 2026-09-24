import { appTiming } from "@/config/appTiming";

export const sendTimerConfig = {
  debounced: {
    kind: "fixed",
    ms: appTiming.sendQueue.debounceDelayMs,
  },
  lostConnectionBackoff: {
    kind: "backoff",
    initialMs: appTiming.sendQueue.initialRetryDelayMs,
    multiplier: appTiming.sendQueue.retryBackoffMultiplier,
    maxMs: appTiming.sendQueue.maxRetryDelayMs,
  },
} as const;
