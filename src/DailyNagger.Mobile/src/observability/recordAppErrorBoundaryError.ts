import type { ErrorInfo } from "react";
import * as Sentry from "@sentry/react-native";

export function recordAppErrorBoundaryError(error: Error, errorInfo: ErrorInfo): void {
  Sentry.withScope((scope) => {
    scope.setContext("reactErrorBoundary", {
      componentStack: errorInfo.componentStack,
    });
    scope.addBreadcrumb({
      category: "app.error-boundary",
      data: {
        componentStack: errorInfo.componentStack,
      },
      level: "error",
      message: error.message,
    });
    Sentry.captureException(error);
  });
}
