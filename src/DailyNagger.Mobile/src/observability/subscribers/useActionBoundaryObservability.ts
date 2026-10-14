import { useCallback, useEffect } from "react";
import type { MiddlewareExecutionContext, MiddlewareWrapperFunction } from "@/middleware";
import type { ActionExecutionEvent, ActionExecutionEventType } from "@/services/action-boundary";
import type { EventEmitter } from "@/shared";
import { recordSpanValue, reportError, spanAttributeKeys, startNewSpan } from "../sentry";

export function useActionBoundaryObservability(
  actionEvents: EventEmitter<ActionExecutionEventType, ActionExecutionEvent>,
): MiddlewareWrapperFunction<MiddlewareExecutionContext> {
  useEffect(() => {
    return actionEvents.subscribe((eventType, event) => {
      if (eventType === "action-failed") {
        reportError(event.error, event.causalityKey);
      }
    });
  }, [actionEvents]);

  return useCallback((context, run) => {
    return startNewSpan({
      name: context.metadata?.actionKey ?? context.causalityKey,
      operation: "dn.action",
      run: () => {
        recordSpanValue("dn.action.key", context.metadata?.actionKey);
        recordSpanValue("dn.action.scope", context.metadata?.actionScope);
        recordSpanValue(spanAttributeKeys.causalityKey, context.causalityKey);

        return run();
      },
    });
  }, []);
}
