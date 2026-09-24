import type { TraversedNode } from "./traversed-node";
import type { VisitRequest } from "./contracts";
import type { VisitBubble, VisitResult } from "./visitResult";

export type VisitArrayResult<TNode extends TraversedNode> = {
  readonly wasVisited: boolean;
  readonly nodes: readonly TNode[];
  readonly collectedNodes: readonly TraversedNode[];
  readonly indexHint: number;
  readonly bubble: VisitBubble;
};

type VisitTargetArrayNodesProps<TNode extends TraversedNode> = {
  readonly ownerNode: { readonly clientProps?: { readonly indexHint?: number } };
  readonly nodes: readonly TNode[];
  readonly shouldVisitNode: (node: TNode) => boolean;
  readonly visitNode: (node: TNode) => VisitResult<TNode>;
};

type VisitWholeArrayNodesProps<TNode extends TraversedNode> = {
  readonly ownerNode: { readonly clientProps?: { readonly indexHint?: number } };
  readonly initialCollectedNodes: readonly TraversedNode[];
  readonly nodes: readonly TNode[];
  readonly visitNode: (node: TNode) => VisitResult<TNode>;
};

type VisitArrayNodesInput<TNode extends TraversedNode> = {
  readonly request: VisitRequest;
  readonly shouldVisitArray: boolean;
  readonly ownerNode: { readonly clientProps?: { readonly indexHint?: number } };
  readonly initialCollectedNodes: readonly TraversedNode[];
  readonly nodes: readonly TNode[];
  readonly shouldVisitNode: (node: TNode) => boolean;
  readonly visitNode: (node: TNode) => VisitResult<TNode>;
};

export function visitArrayNodes<TNode extends TraversedNode>({
  request,
  shouldVisitArray,
  ownerNode,
  initialCollectedNodes,
  nodes,
  shouldVisitNode,
  visitNode,
}: VisitArrayNodesInput<TNode>): VisitArrayResult<TNode> {
  if (!shouldVisitArray) return notVisited(ownerNode, nodes);

  if (request.kind === "whole-tree") {
    return visitWholeArrayNodes({
      ownerNode,
      initialCollectedNodes,
      nodes,
      visitNode,
    });
  }

  return visitTargetArrayNode({
    ownerNode,
    nodes,
    shouldVisitNode,
    visitNode,
  });
}

function visitTargetArrayNode<TNode extends TraversedNode>({
  ownerNode,
  nodes,
  shouldVisitNode,
  visitNode,
}: VisitTargetArrayNodesProps<TNode>): VisitArrayResult<TNode> {
  const indexHint = getIndexHint(ownerNode, nodes.length);

  for (let loopIndex = 0; loopIndex < nodes.length; loopIndex++) {
    const index = getIndex(loopIndex, indexHint);
    const node = nodes[index];

    if (!shouldVisitNode(node)) continue;

    const result = visitNode(node);

    if (result.kind === "not-found") continue;

    const copiedNodes = nodes.slice();
    copiedNodes[index] = result.node;
    return {
      wasVisited: true,
      nodes: copiedNodes,
      collectedNodes: result.collectedNodes,
      indexHint: index,
      bubble: result.bubble,
    };
  }

  return notVisited(ownerNode, nodes);
}

function visitWholeArrayNodes<TNode extends TraversedNode>({
  ownerNode,
  initialCollectedNodes,
  nodes,
  visitNode,
}: VisitWholeArrayNodesProps<TNode>): VisitArrayResult<TNode> {
  let collectedNodes: readonly TraversedNode[] = initialCollectedNodes;

  const newNodes = nodes.map((node) => {
    const result = visitNode(node);

    if (result.kind === "not-found") return node;

    collectedNodes = [...collectedNodes, ...result.collectedNodes];
    return result.node;
  });

  return {
    wasVisited: true,
    nodes: newNodes,
    collectedNodes,
    indexHint: getIndexHint(ownerNode, nodes.length),
    bubble: { kind: "none" },
  };
}

function notVisited<TNode extends TraversedNode>(
  ownerNode: { readonly clientProps?: { readonly indexHint?: number } },
  nodes: readonly TNode[],
): VisitArrayResult<TNode> {
  return {
    wasVisited: false,
    nodes,
    collectedNodes: [],
    indexHint: getIndexHint(ownerNode, nodes.length),
    bubble: { kind: "none" },
  };
}

function getIndexHint(
  node: { readonly clientProps?: { readonly indexHint?: number } },
  arrayLength: number,
): number {
  const indexHint = node.clientProps?.indexHint;
  if (indexHint === undefined) return 0;
  if (indexHint < 0) throw new Error("indexHint cannot be negative.");
  if (indexHint >= arrayLength) return 0;
  return indexHint;
}

function getIndex(loopIndex: number, indexHint: number): number {
  if (loopIndex > indexHint) return loopIndex;
  if (loopIndex === 0) return indexHint;
  return loopIndex - 1;
}
