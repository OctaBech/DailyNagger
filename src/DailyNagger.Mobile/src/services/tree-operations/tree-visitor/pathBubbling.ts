import type { TraversedNode } from "./traversed-node";

export function appendPathNode(
  path: readonly TraversedNode[],
  node: TraversedNode,
): readonly TraversedNode[] {
  return [...path, node];
}

