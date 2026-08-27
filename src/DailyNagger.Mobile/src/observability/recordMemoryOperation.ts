import * as Sentry from "@sentry/react-native";

export type MemoryOperation =
  | "clear"
  | "setSelectedPath"
  | "setTree"
  | "setTreeWithoutSelectionRefresh"
  | "setTreeAndSelectedPath"
  | "setTreeAndFocusPath";

type MemoryOperationInput = {
  readonly commandTraceKey: string;
  readonly memoryName: string;
  readonly operation: MemoryOperation;
};

export function recordMemoryOperation<TResult>(
  input: MemoryOperationInput,
  run: () => TResult,
): TResult {
  Sentry.addBreadcrumb({
    category: "memory",
    data: {
      commandTraceKey: input.commandTraceKey,
      memoryName: input.memoryName,
      operation: input.operation,
    },
    level: "info",
    message: `${input.memoryName}.${input.operation}`,
  });

  if (Sentry.getActiveSpan() === undefined) {
    return run();
  }

  return Sentry.startSpan(
    {
      attributes: {
        commandTraceKey: input.commandTraceKey,
        "memory.name": input.memoryName,
        "memory.operation": input.operation,
      },
      name: `${input.memoryName}.${input.operation}`,
      op: "memory.update",
    },
    run,
  );
}
