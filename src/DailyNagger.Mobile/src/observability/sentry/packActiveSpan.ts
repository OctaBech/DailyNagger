import * as Sentry from "@sentry/react-native";
import { getTraceData } from "@sentry/core";
import { getActiveCausalityKey } from "./getActiveCausalityKey";
import { spanAttributeKeys } from "./spanAttributeKeys";

export type PackedSpan = {
  readonly [spanAttributeKeys.causalityKey]: string | null;
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
    [spanAttributeKeys.causalityKey]: getActiveCausalityKey() ?? null,
    baggage: traceData.baggage ?? null,
    sentryTrace,
  };
}
