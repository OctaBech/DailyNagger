import { useEffect } from "react";
import {
  appErrorBoundaryEvents,
  type AppErrorBoundaryEvent,
  type AppErrorBoundaryEventType,
} from "@/app-shell/appErrorBoundaryEvents";
import { assertNever } from "@/shared";
import { captureError, recordBreadcrumb } from "../sentry";

export function useAppErrorBoundaryObservability(): void {
  useEffect(() => {
    return appErrorBoundaryEvents.subscribe((eventType, event) => {
      recordAppErrorBoundaryEvent(eventType, event);
    });
  }, []);
}

function recordAppErrorBoundaryEvent(
  eventType: AppErrorBoundaryEventType,
  event: AppErrorBoundaryEvent,
): void {
  switch (eventType) {
    case "app.error-boundary.caught":
      recordAppErrorBoundaryCaught(eventType, event);
      return;

    default:
      assertNever(eventType);
  }
}

function recordAppErrorBoundaryCaught(
  eventType: AppErrorBoundaryEventType,
  event: AppErrorBoundaryEvent,
): void {
  recordBreadcrumb({
    category: "app.error-boundary",
    data: {
      componentStack: event.errorInfo.componentStack,
    },
    level: "error",
    message: eventType,
  });

  captureError(event.error);
}
