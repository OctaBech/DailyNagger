import type { TraversedNode } from "../../core-tree-operations/traversed-node/contracts";

export function appendPathNode(
  path: readonly TraversedNode[],
  node: TraversedNode,
): readonly TraversedNode[] {
  return [...path, node];
}
