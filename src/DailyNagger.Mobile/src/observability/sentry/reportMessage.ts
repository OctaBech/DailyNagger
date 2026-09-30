import * as Sentry from "@sentry/react-native";

export function reportMessage(message: string, level: "warning" | "error" = "error"): void {
  Sentry.captureMessage(message, level);
}
