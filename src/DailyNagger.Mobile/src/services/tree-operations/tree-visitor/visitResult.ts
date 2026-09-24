import type { TraversedNode } from "./traversed-node";
import type { VisitContext } from "./contracts";
import { assertSameNodeIdentity } from "./nodeIdentity";
import { appendCollectedNode } from "./nodeCollection";

export type VisitResult<TNode extends TraversedNode> =
  | {
      readonly kind: "not-found";
      readonly node: TNode;
    }
  | {
      readonly kind: "visited";
      readonly node: TNode;
      readonly collectedNodes: readonly TraversedNode[];
      readonly bubble: VisitBubble;
    };

export type VisitBubble =
  | {
      readonly kind: "none";
    }
  | {
      readonly kind: "found-target";
    }
  | {
      readonly kind: "found-parent";
    };

type VisitCurrentNodeProps<TNode extends TraversedNode> = {
  readonly node: TNode;
  readonly collectedChildNodes: readonly TraversedNode[];
  readonly visitNode: ((node: TNode, context: VisitContext) => TNode) | undefined;
  readonly allowIdentityChange?: boolean;
  readonly isTargetNode?: boolean;
  readonly childBubble?: VisitBubble;
};

export function visitCurrentNode<TNode extends TraversedNode>({
  node,
  collectedChildNodes,
  visitNode,
  allowIdentityChange = false,
  isTargetNode = false,
  childBubble = { kind: "none" },
}: VisitCurrentNodeProps<TNode>): VisitResult<TNode> {
  const nodesThroughCurrent = appendCollectedNode(collectedChildNodes, node);
  const isTargetParent = childBubble.kind === "found-target";
  const visitedNode =
    visitNode?.(node, { isTargetNode, isTargetParent, path: nodesThroughCurrent }) ?? node;

  if (__DEV__ && !allowIdentityChange) {
    assertSameNodeIdentity(node, visitedNode);
  }

  return {
    kind: "visited",
    node: visitedNode,
    collectedNodes: appendCollectedNode(collectedChildNodes, visitedNode),
    bubble: getBubble({ isTargetNode, childBubble }),
  };
}

export function nodeNotFound<TNode extends TraversedNode>(node: TNode): VisitResult<TNode> {
  return { kind: "not-found", node };
}

function getBubble({
  isTargetNode,
  childBubble,
}: {
  readonly isTargetNode: boolean;
  readonly childBubble: VisitBubble;
}): VisitBubble {
  if (isTargetNode) return { kind: "found-target" };
  if (childBubble.kind === "found-target") return { kind: "found-parent" };
  return childBubble;
}
