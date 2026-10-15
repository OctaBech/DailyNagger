import * as Sentry from "@sentry/react-native";
import { getActiveCausalityKey } from "./getActiveCausalityKey";
import { spanAttributeKeys } from "./spanAttributeKeys";

export function reportError(error: unknown, causalityKey?: string): void {
  const key = causalityKey ?? getActiveCausalityKey();
  if (key === undefined) {
    Sentry.captureException(error);
    return;
  }

  Sentry.captureException(error, {
    tags: { [spanAttributeKeys.causalityKey]: key },
  });
}
