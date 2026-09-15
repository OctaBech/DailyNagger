import * as Sentry from "@sentry/react-native";
import { getTraceData } from "@sentry/core";

export type PackedSpan = {
  readonly baggage: string | null;
  readonly sentryTrace: string;
};

export function packActiveSpan(): PackedSpan | null {
  const span = Sentry.getActiveSpan();
  if (span === undefined) return null;

  const traceData = getTraceData({ span });
  const sentryTrace = traceData["sentry-trace"];
  if (sentryTrace === undefined) return null;

  return {
    baggage: traceData.baggage ?? null,
    sentryTrace,
  };
}
