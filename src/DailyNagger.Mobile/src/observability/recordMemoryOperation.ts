import type { Observability } from "./observabilityContext";
import { recordContinuedSpan } from "./recordContinuedSpan";

export type MemoryOperation =
  | "clear"
  | "setSelectedPath"
  | "setTree"
  | "setTreeWithoutSelectionRefresh"
  | "setTreeAndSelectedPath"
  | "setTreeAndFocusPath";

export function recordMemoryOperation<TResult>(
  observability: Observability,
  memoryName: string,
  operation: MemoryOperation,
  run: () => TResult,
): TResult {
  const { causality } = observability.context;
  const attributes = {
    "dn.causality.id": causality.id,
    "dn.causality.key": causality.key,
    "dn.memory.name": memoryName,
    "dn.memory.operation": operation,
  };

  return recordContinuedSpan(
    {
      attributes,
      breadcrumbCategory: "memory",
      breadcrumbMessage: `${memoryName}.${operation}`,
      name: `${memoryName}.${operation}`,
      observability,
      operation: "dn.memory",
    },
    run,
  );
}
