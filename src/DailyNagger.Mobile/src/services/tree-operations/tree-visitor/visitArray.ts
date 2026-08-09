import type { TraversedNode } from "../../core-tree-operations/traversed-node/contracts";
import type { VisitRequest } from "./contracts";
import type { VisitResult } from "./visitResult";

type VisitArrayResult<TNode extends TraversedNode> =
  | {
      readonly kind: "not-found";
      readonly nodes: readonly TNode[];
    }
  | {
      readonly kind: "visited";
      readonly nodes: readonly TNode[];
      readonly recordedPath: readonly TraversedNode[];
      readonly indexFound: number;
    };

type VisitTargetArrayNodesProps<TNode extends TraversedNode> = {
  readonly request: { readonly kind: "target" };
  readonly ownerNode: { readonly clientProps?: { readonly indexHint?: number } };
  readonly nodes: readonly TNode[];
  readonly shouldVisitNode: (node: TNode) => boolean;
  readonly visitNode: (node: TNode) => VisitResult<TNode>;
};

type VisitAllArrayNodesProps<TNode extends TraversedNode> = {
  readonly request: { readonly kind: "all" };
  readonly ownerNode: { readonly clientProps?: { readonly indexHint?: number } };
  readonly ownerPath: readonly TraversedNode[];
  readonly nodes: readonly TNode[];
  readonly visitNode: (node: TNode) => VisitResult<TNode>;
};

type VisitArrayNodesInput<TNode extends TraversedNode> = {
  readonly request: VisitRequest;
  readonly ownerNode: { readonly clientProps?: { readonly indexHint?: number } };
  readonly ownerPath: readonly TraversedNode[];
  readonly nodes: readonly TNode[];
  readonly shouldVisitNode: (node: TNode) => boolean;
  readonly visitNode: (node: TNode) => VisitResult<TNode>;
};

export function visitArrayNodes<TNode extends TraversedNode>({
  request,
  ownerNode,
  ownerPath,
  nodes,
  shouldVisitNode,
  visitNode,
}: VisitArrayNodesInput<TNode>): VisitArrayResult<TNode> {
  if (request.kind === "all") {
    return visitAllArrayNodes({
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
}: Omit<VisitTargetArrayNodesProps<TNode>, "request">): VisitArrayResult<TNode> {
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
      kind: "visited",
      nodes: copiedNodes,
      recordedPath: result.recordedPath,
      indexFound: index,
    };
  }

  return {
    kind: "not-found",
    nodes,
  };
}

function visitAllArrayNodes<TNode extends TraversedNode>({
  ownerNode,
  ownerPath,
  nodes,
  visitNode,
}: Omit<VisitAllArrayNodesProps<TNode>, "request">): VisitArrayResult<TNode> {
  let recordedPath: readonly TraversedNode[] = ownerPath;

  const newNodes = nodes.map((node) => {
    const result = visitNode(node);

    if (result.kind === "not-found") return node;

    recordedPath = [...recordedPath, ...result.recordedPath];
    return result.node;
  });

  return {
    kind: "visited",
    nodes: newNodes,
    recordedPath,
    indexFound: getIndexHint(ownerNode, nodes.length),
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
