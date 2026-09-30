import * as Sentry from "@sentry/react-native";

export function captureMessage(message: string, level: "warning" | "error" = "error"): void {
  Sentry.captureMessage(message, level);
}
