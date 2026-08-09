import { appTiming } from "@/config";

export const sendTimerConfig = {
  debounced: {
    kind: "fixed",
    ms: appTiming.sendQueue.debounceDelayMs,
  },
  delayedAfterFailure: {
    kind: "backoff",
    initialMs: appTiming.sendQueue.initialRetryDelayMs,
    multiplier: appTiming.sendQueue.retryBackoffMultiplier,
    maxMs: appTiming.sendQueue.maxRetryDelayMs,
  },
} as const;
