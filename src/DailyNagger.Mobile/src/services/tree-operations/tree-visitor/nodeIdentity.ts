import type { TraversedNode } from "../../core-tree-operations/traversed-node/contracts";

const identityKeys = ["id", "taskLogId", "parentTaskItemId"] as const;

type IdentityKey = (typeof identityKeys)[number];
type NodeWithIdentityKey = TraversedNode & Partial<Record<IdentityKey, unknown>>;

export function assertSameNodeIdentity(oldNode: TraversedNode, newNode: TraversedNode): void {
  const oldIdentityNode = oldNode as NodeWithIdentityKey;
  const newIdentityNode = newNode as NodeWithIdentityKey;

  for (const key of identityKeys) {
    if (!(key in oldIdentityNode)) continue;

    if (!(key in newIdentityNode)) {
      throw new Error(
        `Tree visitor changed node identity shape. Missing '${key}' on returned node.`,
      );
    }

    if (oldIdentityNode[key] !== newIdentityNode[key]) {
      throw new Error(`Tree visitor changed node identity field '${key}'.`);
    }
  }
}
