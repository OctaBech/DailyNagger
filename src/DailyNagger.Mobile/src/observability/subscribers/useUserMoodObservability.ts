import { useCallback } from "react";
import type { MiddlewareWrapperFunction } from "@/middleware";
import { recordSpanValue, startNewSpan } from "../sentry";

export function useUserMoodObservability(): MiddlewareWrapperFunction {
  return useCallback((context, run) => {
    return startNewSpan({
      name: context.causalityKey,
      operation: "dn.user-mood.select",
      run: () => {
        recordSpanValue("dn.causality.key", context.causalityKey);
        recordSpanValue("dn.user_mood.mood", context.metadata?.mood);

        return run();
      },
    });
  }, []);
}
