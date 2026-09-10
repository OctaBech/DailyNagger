import { useEffect } from "react";
import type { ActionExecutionEvent, ActionExecutionEventType } from "@/services/action-boundary";
import type { EventEmitter } from "@/shared";

export function useActionBoundaryObservability(
  actionEvents: EventEmitter<ActionExecutionEventType, ActionExecutionEvent>,
): void {
  useEffect(() => {
    return actionEvents.subscribe((eventType, event) => {
      // The action boundary now exposes its lifecycle through events.
      // Sentry-specific recording belongs here later, not in action execution.
      void eventType;
      void event;
    });
  }, [actionEvents]);
}
