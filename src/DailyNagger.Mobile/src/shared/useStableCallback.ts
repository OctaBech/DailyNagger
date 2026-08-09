import { useCallback } from "react";
import { useRefLatestValue } from "./useRefLatestValue";

export function useStableCallback<TArgs extends readonly unknown[], TResult>(
  callback: (...args: TArgs) => TResult,
): (...args: TArgs) => TResult {
  const callbackRef = useRefLatestValue(callback);

  return useCallback(
    (...args: TArgs): TResult => {
      return callbackRef.current(...args);
    },
    [callbackRef],
  );
}
