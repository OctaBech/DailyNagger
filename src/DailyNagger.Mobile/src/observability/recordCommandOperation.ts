import * as Sentry from "@sentry/react-native";
import type { ObservabilityContext } from "./observabilityContext";

export function recordCommandOperation<TResult>(
  observabilityContext: ObservabilityContext,
  run: () => TResult,
): TResult {
  const { causality } = observabilityContext;

  Sentry.addBreadcrumb({
    category: "command",
    data: {
      "dn.causality.id": causality.id,
      "dn.causality.key": causality.key,
      "dn.causality.kind": causality.kind,
      "dn.causality.source": causality.source,
      "dn.causality.occurredAt": causality.occurredAt,
    },
    level: "info",
    message: causality.label,
  });

  if (Sentry.getActiveSpan() === undefined) {
    return run();
  }

  return Sentry.startSpan(
    {
      attributes: {
        "dn.causality.id": causality.id,
        "dn.causality.key": causality.key,
        "dn.causality.kind": causality.kind,
        "dn.causality.source": causality.source,
        "dn.causality.occurredAt": causality.occurredAt,
      },
      name: causality.label,
      op: "dn.command",
    },
    run,
  );
}
