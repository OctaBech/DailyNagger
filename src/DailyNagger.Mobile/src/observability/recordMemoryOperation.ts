import * as Sentry from "@sentry/react-native";
import type { ObservabilityContext } from "./observabilityContext";

export type MemoryOperation =
  | "clear"
  | "setSelectedPath"
  | "setTree"
  | "setTreeWithoutSelectionRefresh"
  | "setTreeAndSelectedPath"
  | "setTreeAndFocusPath";

export function recordMemoryOperation<TResult>(
  observabilityContext: ObservabilityContext,
  memoryName: string,
  operation: MemoryOperation,
  run: () => TResult,
): TResult {
  const { causality } = observabilityContext;

  Sentry.addBreadcrumb({
    category: "memory",
    data: {
      "dn.causality.id": causality.id,
      "dn.causality.key": causality.key,
      "dn.memory.name": memoryName,
      "dn.memory.operation": operation,
    },
    level: "info",
    message: `${memoryName}.${operation}`,
  });

  if (Sentry.getActiveSpan() === undefined) {
    return run();
  }

  return Sentry.startSpan(
    {
      attributes: {
        "dn.causality.id": causality.id,
        "dn.causality.key": causality.key,
        "dn.memory.name": memoryName,
        "dn.memory.operation": operation,
      },
      name: `${memoryName}.${operation}`,
      op: "dn.memory",
    },
    run,
  );
}
