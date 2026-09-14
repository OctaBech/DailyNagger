import * as Sentry from "@sentry/react-native";

type SpanValue = string | number | boolean | null | undefined;

export function recordSpanValue(key: string, value: SpanValue): void {
  const span = Sentry.getActiveSpan();
  if (span === undefined) return;

  span.setAttribute(key, value ?? "");
}
