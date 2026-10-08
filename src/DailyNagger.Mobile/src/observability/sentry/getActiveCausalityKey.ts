import * as Sentry from "@sentry/react-native";
import { spanAttributeKeys } from "./spanAttributeKeys";

export function getActiveCausalityKey(): string | undefined {
  const span = Sentry.getActiveSpan();
  if (span === undefined) return undefined;

  const key = Sentry.spanToJSON(span).data[spanAttributeKeys.causalityKey];
  return typeof key === "string" && key.length > 0 ? key : undefined;
}
