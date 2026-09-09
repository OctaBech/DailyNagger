import type { TraversedNode } from "./traversed-node";
import type { VisitRequest } from "./contracts";
import type { VisitBubble, VisitResult } from "./visitResult";

export type VisitArrayResult<TNode extends TraversedNode> = {
  readonly wasVisited: boolean;
  readonly nodes: readonly TNode[];
  readonly recordedPath: readonly TraversedNode[];
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
  readonly ownerPath: readonly TraversedNode[];
  readonly nodes: readonly TNode[];
  readonly visitNode: (node: TNode) => VisitResult<TNode>;
};

type VisitArrayNodesInput<TNode extends TraversedNode> = {
  readonly request: VisitRequest;
  readonly shouldVisitArray: boolean;
  readonly ownerNode: { readonly clientProps?: { readonly indexHint?: number } };
  readonly ownerPath: readonly TraversedNode[];
  readonly nodes: readonly TNode[];
  readonly shouldVisitNode: (node: TNode) => boolean;
  readonly visitNode: (node: TNode) => VisitResult<TNode>;
};

export function visitArrayNodes<TNode extends TraversedNode>({
  request,
  shouldVisitArray,
  ownerNode,
  ownerPath,
  nodes,
  shouldVisitNode,
  visitNode,
}: VisitArrayNodesInput<TNode>): VisitArrayResult<TNode> {
  if (!shouldVisitArray) return notVisited(ownerNode, nodes);

  if (request.kind === "whole-tree") {
    return visitWholeArrayNodes({
      ownerNode,
      ownerPath,
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
      recordedPath: result.recordedPath,
      indexHint: index,
      bubble: result.bubble,
    };
  }

  return notVisited(ownerNode, nodes);
}

function visitWholeArrayNodes<TNode extends TraversedNode>({
  ownerNode,
  ownerPath,
  nodes,
  visitNode,
}: VisitWholeArrayNodesProps<TNode>): VisitArrayResult<TNode> {
  let recordedPath: readonly TraversedNode[] = ownerPath;

  const newNodes = nodes.map((node) => {
    const result = visitNode(node);

    if (result.kind === "not-found") return node;

    recordedPath = [...recordedPath, ...result.recordedPath];
    return result.node;
  });

  return {
    wasVisited: true,
    nodes: newNodes,
    recordedPath,
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
    recordedPath: [],
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

