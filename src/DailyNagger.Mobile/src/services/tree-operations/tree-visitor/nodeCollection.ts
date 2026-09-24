import type { TraversedNode } from "./traversed-node";

export function appendCollectedNode(
  collectedNodes: readonly TraversedNode[],
  node: TraversedNode,
): readonly TraversedNode[] {
  return [...collectedNodes, node];
}
