import * as Sentry from "@sentry/react-native";

export function getActiveSentryTraceHeader(): string | null {
  const span = Sentry.getActiveSpan();
  if (span === undefined) return null;

  const spanContext = span.spanContext();
  const sampled = spanContext.traceFlags === 1 ? "1" : "0";

  return `${spanContext.traceId}-${spanContext.spanId}-${sampled}`;
}
