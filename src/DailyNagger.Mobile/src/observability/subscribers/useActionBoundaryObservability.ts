import { useCallback, useEffect } from "react";
import { sentryConfig } from "@/config/sentryConfig";
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
    const actionName = context.metadata?.actionKey ?? context.causalityKey;
    const nodeIds: string[] = [];
    const nodeAliases: string[] = [];
    const actionArguments = context.actionArguments;

    // Read only direct node ids, never names, values or child nodes.
    if (typeof actionArguments === "object" && actionArguments !== null) {
      for (const argument of Object.values(actionArguments)) {
        if (
          typeof argument === "object" &&
          argument !== null &&
          "id" in argument &&
          typeof argument.id === "string"
        ) {
          nodeIds.push(argument.id);
          nodeAliases.push(
            `node:${getLastXCharactersOfNodeId(argument, sentryConfig.nodeIdDisplayLength)}`,
          );
        }
      }
    }

    return startNewSpan({
      name: nodeAliases.length > 0 ? `${actionName} [${nodeAliases.join(", ")}]` : actionName,
      operation: "dn.action",
      run: () => {
        recordSpanValue("dn.action.key", context.metadata?.actionKey);
        recordSpanValue("dn.action.service_package", context.metadata?.servicePackageName);
        recordSpanValue(spanAttributeKeys.causalityKey, context.causalityKey);
        if (nodeIds.length > 0) recordSpanValue(spanAttributeKeys.nodeIds, nodeIds);

        return run();
      },
    });
  }, []);
}

function getLastXCharactersOfNodeId(node: { readonly id: string }, x: number): string {
  return node.id.slice(-x);
}
