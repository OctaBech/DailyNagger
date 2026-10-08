import { spanAttributeKeys } from "@/observability/sentry/spanAttributeKeys";

export const apiRequestHeaders = {
  authorization: "Authorization",
  requestId: spanAttributeKeys.requestId,
  sentryTrace: "sentry-trace",
} as const;
