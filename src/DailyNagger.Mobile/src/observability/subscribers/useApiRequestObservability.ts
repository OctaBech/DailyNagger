import { useEffect } from "react";
import { apiRequestEvents, type ApiRequestEvent, type ApiRequestEventType } from "@/api/client";
import { assertNever } from "@/shared";
import { captureError, recordBreadcrumb, recordSpanValue } from "../sentry";

export function useApiRequestObservability(): void {
  useEffect(() => {
    return apiRequestEvents.subscribe((eventType, event) => {
      recordApiRequestEvent(eventType, event);
    });
  }, []);
}

function recordApiRequestEvent(eventType: ApiRequestEventType, event: ApiRequestEvent): void {
  switch (eventType) {
    case "api.request.started":
      recordApiRequestBreadcrumb(eventType, event);
      recordApiRequestValues(event);
      return;

    case "api.request.finished":
      recordApiRequestBreadcrumb(eventType, event);
      recordApiRequestValues(event);
      return;

    case "api.request.failed":
      recordApiRequestBreadcrumb(eventType, event, "error");
      recordApiRequestValues(event);
      recordSpanValue("dn.api.failed", true);
      captureError(event.error);
      return;

    default:
      assertNever(eventType);
  }
}

function recordApiRequestValues(event: ApiRequestEvent): void {
  recordSpanValue("dn.api.request_id", event.requestId);
  recordSpanValue("dn.api.method", event.method);
  recordSpanValue("dn.api.path", event.path);
  recordSpanValue("dn.api.status", event.status);
  recordSpanValue("dn.api.duration_ms", event.durationMs);
}

function recordApiRequestBreadcrumb(
  eventType: ApiRequestEventType,
  event: ApiRequestEvent,
  level: "info" | "error" = "info",
): void {
  recordBreadcrumb({
    category: "api",
    data: {
      durationMs: event.durationMs,
      method: event.method,
      path: event.path,
      requestId: event.requestId,
      status: event.status,
    },
    level,
    message: eventType,
  });
}
