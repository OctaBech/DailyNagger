export const apiRequestHeaders = {
  authorization: "Authorization",
  causalityId: "X-DailyNagger-Causality-Id",
  causalityKeys: "X-DailyNagger-Causality-Keys",
  requestId: "X-DailyNagger-Request-Id",
  sentryTrace: "sentry-trace",
} as const;
