import * as Sentry from "@sentry/react-native";
import { continueTrace, getTraceData } from "@sentry/core";
import type { Observability, SpanContinuation } from "./observabilityContext";

type AttributeValue = string | number | boolean | undefined;

type RecordContinuedSpanInput = {
  readonly attributes: Record<string, AttributeValue>;
  readonly breadcrumbCategory: string;
  readonly breadcrumbMessage: string;
  readonly name: string;
  readonly operation: string;
  readonly observability: Observability;
};

export function recordContinuedSpan<TResult>(
  input: RecordContinuedSpanInput,
  run: () => TResult,
): TResult {
  const execute = () => {
    return Sentry.startSpan(
      {
        attributes: input.attributes,
        name: input.name,
        op: input.operation,
      },
      () => {
        Sentry.addBreadcrumb({
          category: input.breadcrumbCategory,
          data: input.attributes,
          level: "info",
          message: input.breadcrumbMessage,
        });

        return run();
      },
    );
  };

  const { spanContinuation } = input.observability;
  if (spanContinuation === null) return execute();

  return continueTrace(
    {
      baggage: spanContinuation.baggage ?? undefined,
      sentryTrace: spanContinuation.sentryTrace,
    },
    execute,
  );
}

export function createSpanContinuation(span: Sentry.Span): SpanContinuation | null {
  const traceData = getTraceData({ span });
  const sentryTrace = traceData["sentry-trace"];
  if (sentryTrace === undefined) return null;

  return {
    baggage: traceData.baggage ?? null,
    sentryTrace,
  };
}
