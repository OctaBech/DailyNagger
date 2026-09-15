import { useCallback } from "react";
import type { MiddlewareWrapperFunction } from "@/middleware";
import { recordSpanValue, startNewSpan } from "../sentry";

export function useRolloverObservability(): MiddlewareWrapperFunction {
  return useCallback((context, run) => {
    return startNewSpan({
      name: context.causalityKey,
      operation: "dn.rollover.nagger",
      run: () => {
        recordSpanValue("dn.causality.key", context.causalityKey);
        recordSpanValue("dn.nagger.id", context.metadata?.naggerId);
        recordSpanValue("dn.task_log.id", context.metadata?.taskLogId);

        return run();
      },
    });
  }, []);
}
