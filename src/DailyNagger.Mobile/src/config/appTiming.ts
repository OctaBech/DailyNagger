export const appTiming = {
  input: {
    autoCommitDelayMs: 5000,
  },
  loading: {
    preparingRetryDelayMs: 5 * 60 * 1000,
  },
  rollover: {
    dayBoundaryTime: "05:00",
    checkIntervalMs: 15 * 60 * 1000,
  },
  sendQueue: {
    debounceDelayMs: 1000,
    sendNextDelayMs: 50,
    initialRetryDelayMs: 5000,
    maxRetryDelayMs: 60000,
    maxPersistedAgeMs: 24 * 60 * 60 * 1000,
    retryBackoffMultiplier: 2,
  },
  reactQuery: {
    remoteListStaleTimeMs: 5 * 60 * 1000,
  },
  speedDial: {
    hesitationAssistDelayMs: 1100,
  },
} as const;
