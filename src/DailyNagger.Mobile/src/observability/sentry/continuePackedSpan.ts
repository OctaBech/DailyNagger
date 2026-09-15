import { continueTrace } from "@sentry/core";
import type { PackedSpan } from "./packActiveSpan";

export function continuePackedSpan<TResult>(
  packedSpan: PackedSpan | null,
  run: () => TResult,
): TResult {
  if (packedSpan === null) return run();

  return continueTrace(
    {
      baggage: packedSpan.baggage ?? undefined,
      sentryTrace: packedSpan.sentryTrace,
    },
    run,
  );
}
