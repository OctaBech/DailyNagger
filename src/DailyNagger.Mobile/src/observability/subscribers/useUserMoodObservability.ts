import { useCallback } from "react";
import type { MiddlewareExecutionContext, MiddlewareWrapperFunction } from "@/middleware";
import { recordSpanValue, spanAttributeKeys, startNewSpan } from "../sentry";

export function useUserMoodObservability(): MiddlewareWrapperFunction<MiddlewareExecutionContext> {
  return useCallback((context, run) => {
    return startNewSpan({
      name: context.causalityKey,
      operation: "dn.user-mood.select",
      run: () => {
        recordSpanValue(spanAttributeKeys.causalityKey, context.causalityKey);
        recordSpanValue("dn.user_mood.mood", context.metadata?.mood);

        return run();
      },
    });
  }, []);
}
