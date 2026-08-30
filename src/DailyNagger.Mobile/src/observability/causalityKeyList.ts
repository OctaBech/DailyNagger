export function mergeCausalityKeys(
  left: readonly string[] | undefined,
  right: readonly string[] | undefined,
): string[] {
  return [...new Set([...(left ?? []), ...(right ?? [])])];
}

export function buildCausalityKeyAttributes(
  causalityKeys: readonly string[] | undefined,
): Record<string, string> {
  const keys = causalityKeys ?? [];
  if (keys.length === 0) return {};

  return {
    "dn.causality.key": keys[0],
    "dn.causality.keys": keys.join(","),
  };
}
