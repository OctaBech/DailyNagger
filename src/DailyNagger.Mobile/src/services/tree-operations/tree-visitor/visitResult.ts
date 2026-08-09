import type { TraversedNode } from "../../core-tree-operations/traversed-node/contracts";
import type { VisitContext } from "./contracts";
import { assertSameNodeIdentity } from "./nodeIdentity";
import { appendPathNode } from "./pathBubbling";

export type VisitResult<TNode extends TraversedNode> =
  | {
      readonly kind: "not-found";
      readonly node: TNode;
    }
  | {
      readonly kind: "visited";
      readonly node: TNode;
      readonly recordedPath: readonly TraversedNode[];
    };

type VisitCurrentNodeProps<TNode extends TraversedNode> = {
  readonly node: TNode;
  readonly childPath: readonly TraversedNode[];
  readonly visitNode: ((node: TNode, context: VisitContext) => TNode) | undefined;
  readonly allowIdentityChange?: boolean;
  readonly isTargetNode?: boolean;
};

export function visitCurrentNode<TNode extends TraversedNode>({
  node,
  childPath,
  visitNode,
  allowIdentityChange = false,
  isTargetNode = false,
}: VisitCurrentNodeProps<TNode>): VisitResult<TNode> {
  const ownRecordedPath = appendPathNode(childPath, node);
  const visitedNode = visitNode?.(node, { isTargetNode, path: ownRecordedPath }) ?? node;

  if (__DEV__ && !allowIdentityChange) {
    assertSameNodeIdentity(node, visitedNode);
  }

  return {
    kind: "visited",
    node: visitedNode,
    recordedPath: appendPathNode(childPath, visitedNode),
  };
}

export function nodeNotFound<TNode extends TraversedNode>(node: TNode): VisitResult<TNode> {
  return { kind: "not-found", node };
}
