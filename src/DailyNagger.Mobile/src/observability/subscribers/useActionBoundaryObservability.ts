import { useCallback, useEffect } from "react";
import type { MiddlewareWrapperFunction } from "@/middleware";
import type { ActionExecutionContext } from "@/services/action-boundary/events";
import type { ActionExecutionEvent, ActionExecutionEventType } from "@/services/action-boundary";
import type { EventEmitter } from "@/shared";
import { recordSpanValue, reportError, spanAttributeKeys, startNewSpan } from "../sentry";

export function useActionBoundaryObservability(
  actionEvents: EventEmitter<ActionExecutionEventType, ActionExecutionEvent>,
): MiddlewareWrapperFunction<ActionExecutionContext> {
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
        recordSpanValue("dn.action.service_package", context.metadata?.servicePackageName);
        recordSpanValue(spanAttributeKeys.causalityKey, context.causalityKey);

        return run();
      },
    });
  }, []);
}
