export function mergeCommandTraceKeys(
  left: readonly string[] | undefined,
  right: readonly string[] | undefined,
): string[] {
  return [...new Set([...(left ?? []), ...(right ?? [])])];
}

export function createCommandTraceKeyAttributes(
  commandTraceKeys: readonly string[] | undefined,
): Record<string, string> {
  const keys = commandTraceKeys ?? [];
  if (keys.length === 0) return {};

  return {
    commandTraceKey: keys[0],
    commandTraceKeys: keys.join(","),
  };
}
