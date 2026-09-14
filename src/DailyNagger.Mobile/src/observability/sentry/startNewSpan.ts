import * as Sentry from "@sentry/react-native";

type StartNewSpanInput<TResult> = {
  readonly name: string;
  readonly operation: string;
  readonly run: () => TResult;
};

export function startNewSpan<TResult>({
  name,
  operation,
  run,
}: StartNewSpanInput<TResult>): TResult {
  return Sentry.startSpan(
    {
      name,
      op: operation,
    },
    run,
  );
}
