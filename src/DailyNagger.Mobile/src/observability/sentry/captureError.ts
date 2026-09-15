import * as Sentry from "@sentry/react-native";

export function captureError(error: unknown): void {
  Sentry.captureException(error);
}
