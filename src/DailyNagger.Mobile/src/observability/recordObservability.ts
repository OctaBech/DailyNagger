import * as Sentry from "@sentry/react-native";
import type { Observability, ObservabilityContext } from "./observabilityContext";
import { createSpanContinuation } from "./recordContinuedSpan";

type RecordObservabilityInput = {
  readonly breadcrumbCategory: string;
  readonly context: ObservabilityContext;
  readonly operation: string;
};

export function recordObservability({
  breadcrumbCategory,
  context,
  operation,
}: RecordObservabilityInput): Observability {
  const { causality } = context;
  const attributes = {
    "dn.causality.id": causality.id,
    "dn.causality.key": causality.key,
    "dn.causality.kind": causality.kind,
    "dn.causality.source": causality.source,
    "dn.causality.occurredAt": causality.occurredAt,
  };

  const span = Sentry.startInactiveSpan({
    attributes,
    name: causality.label,
    op: operation,
  });
  const spanContinuation = createSpanContinuation(span);

  Sentry.addBreadcrumb({
    category: breadcrumbCategory,
    data: attributes,
    level: "info",
    message: causality.label,
  });

  span.end();

  return {
    context,
    spanContinuation,
  };
}
