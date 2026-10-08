import * as Sentry from "@sentry/react-native";
import { getActiveCausalityKey } from "./getActiveCausalityKey";
import { spanAttributeKeys } from "./spanAttributeKeys";

export function reportMessage(message: string, level: "warning" | "error" = "error"): void {
  const causalityKey = getActiveCausalityKey();
  if (causalityKey === undefined) {
    Sentry.captureMessage(message, level);
    return;
  }

  Sentry.captureMessage(message, {
    level,
    tags: { [spanAttributeKeys.causalityKey]: causalityKey },
  });
}
