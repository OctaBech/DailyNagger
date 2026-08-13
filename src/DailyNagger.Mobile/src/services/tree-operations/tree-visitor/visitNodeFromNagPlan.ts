import type {
  NaggerTraversedNode,
  NagPlanTraversedNode,
} from "../../core-tree-operations/traversed-node/contracts";
import type { TreeVisitor, VisitRequest } from "./contracts";
import { visitArrayNodes } from "./visitArray";
import { visitNodeFromNagger } from "./visitNodeFromNagger";
import { nodeNotFound, visitCurrentNode, type VisitResult } from "./visitResult";

export function visitNodeFromNagPlan(
  nagPlan: NagPlanTraversedNode,
  request: VisitRequest,
  visitor: TreeVisitor,
): VisitResult<NagPlanTraversedNode> {
  const naggerResult = visitArrayNodes({
    request,
    ownerNode: nagPlan,
    ownerPath: [],
    nodes: nagPlan.nags,
    shouldVisitNode: (nagger) => shouldVisitNagger(request, nagger),
    visitNode: (nagger) => visitNodeFromNagger(nagger, request, visitor),
  });

  if (naggerResult.kind === "visited") {
    const nodeWithVisitedNaggers = withNaggers(
      nagPlan,
      naggerResult.nodes,
      naggerResult.indexFound,
    );

    return visitCurrentNode({
      node: nodeWithVisitedNaggers,
      childPath: naggerResult.recordedPath,
      childBubble: naggerResult.bubble,
      visitNode: visitor.visitNagPlan,
    });
  }

  return nodeNotFound(nagPlan);
}

function shouldVisitNagger(request: VisitRequest, nagger: NaggerTraversedNode): boolean {
  if (request.kind === "all") return true;

  switch (request.target.kind) {
    case "nagger":
      return request.target.id === nagger.id;
    case "task-entry":
    case "task-item":
    case "task-log":
      return request.target.requiredAncestry.naggerId === nagger.id;
  }
}

function withNaggers(
  nagPlan: NagPlanTraversedNode,
  nags: readonly NaggerTraversedNode[],
  indexHint: number,
): NagPlanTraversedNode {
  return {
    ...nagPlan,
    nags,
    clientProps: { ...nagPlan.clientProps, indexHint },
  };
}
