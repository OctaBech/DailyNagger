import * as Sentry from "@sentry/react-native";

export function reportError(error: unknown): void {
  Sentry.captureException(error);
}
