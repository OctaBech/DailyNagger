import { continuePackedSpan } from "./continuePackedSpan";
import type { PackedSpan } from "./packActiveSpan";
import { recordSpanValue } from "./recordSpanValue";
import { spanAttributeKeys } from "./spanAttributeKeys";
import { startNewSpan, type StartNewSpanInput } from "./startNewSpan";

export function runWithPackedSpan<TResult>(
  packedSpan: PackedSpan | null,
  { run, ...spanOptions }: StartNewSpanInput<TResult>,
): TResult {
  return continuePackedSpan(packedSpan, () =>
    startNewSpan({
      ...spanOptions,
      run: () => {
        if (packedSpan !== null && packedSpan[spanAttributeKeys.causalityKey] !== null) {
          recordSpanValue(
            spanAttributeKeys.causalityKey,
            packedSpan[spanAttributeKeys.causalityKey],
          );
        }
        return run();
      },
    }),
  );
}
