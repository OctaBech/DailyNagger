import * as Sentry from "@sentry/react-native";
import { getActiveCausalityKey } from "./getActiveCausalityKey";
import { spanAttributeKeys } from "./spanAttributeKeys";

export function reportError(error: unknown): void {
  const causalityKey = getActiveCausalityKey();
  if (causalityKey === undefined) {
    Sentry.captureException(error);
    return;
  }

  Sentry.captureException(error, {
    tags: { [spanAttributeKeys.causalityKey]: causalityKey },
  });
}
