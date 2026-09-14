import { useCallback, useEffect } from "react";
import type {
  ActionExecutionEvent,
  ActionExecutionEventType,
  ActionExecutionWrapper,
} from "@/services/action-boundary";
import type { EventEmitter } from "@/shared";
import { recordSpanValue, startNewSpan } from "../sentry";

export function useActionBoundaryObservability(
  actionEvents: EventEmitter<ActionExecutionEventType, ActionExecutionEvent>,
): ActionExecutionWrapper {
  useEffect(() => {
    return actionEvents.subscribe((eventType, event) => {
      // The action boundary now exposes its lifecycle through events.
      void eventType;
      void event;
    });
  }, [actionEvents]);

  return useCallback((context, run) => {
    return startNewSpan({
      name: context.actionKey,
      operation: "dn.action",
      run: () => {
        recordSpanValue("dn.action.key", context.actionKey);
        recordSpanValue("dn.action.scope", context.actionScope);
        recordSpanValue("dn.causality.key", context.causalityKey);
        recordSpanValue("dn.action.started_at", context.startedAt);

        return run();
      },
    });
  }, []);
}
