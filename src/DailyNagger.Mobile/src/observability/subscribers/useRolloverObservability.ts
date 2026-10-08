import { useCallback } from "react";
import type { MiddlewareExecutionContext, MiddlewareWrapperFunction } from "@/middleware";
import { recordSpanValue, spanAttributeKeys, startNewSpan } from "../sentry";

export function useRolloverObservability(): MiddlewareWrapperFunction<MiddlewareExecutionContext> {
  return useCallback((context, run) => {
    return startNewSpan({
      name: context.causalityKey,
      operation: "dn.rollover.nagger",
      run: () => {
        recordSpanValue(spanAttributeKeys.causalityKey, context.causalityKey);
        recordSpanValue("dn.nagger.id", context.metadata?.naggerId);
        recordSpanValue("dn.task_log.id", context.metadata?.taskLogId);

        return run();
      },
    });
  }, []);
}
