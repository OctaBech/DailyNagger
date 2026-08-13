import type {
  NaggerTraversedNode,
  TaskLogTraversedNode,
} from "../../core-tree-operations/traversed-node/contracts";
import type { TreeVisitor, VisitRequest } from "./contracts";
import { requestTargetsKind } from "./targetMatching";
import { visitNodeFromTaskLog } from "./visitNodeFromTaskLog";
import { nodeNotFound, visitCurrentNode, type VisitResult } from "./visitResult";

export function visitNodeFromNagger(
  nagger: NaggerTraversedNode,
  request: VisitRequest,
  visitor: TreeVisitor,
): VisitResult<NaggerTraversedNode> {
  if (requestTargetsKind(request, "nagger", nagger.id)) {
    return visitCurrentNode({
      node: nagger,
      childPath: [],
      isTargetNode: true,
      visitNode: visitor.visitNagger,
    });
  }

  if (shouldVisitTaskLog(request, nagger.taskLog)) {
    const taskLogResult = visitNodeFromTaskLog(nagger.taskLog, request, visitor);

    if (taskLogResult.kind === "visited") {
      const nodeWithVisitedTaskLog = {
        ...nagger,
        taskLog: taskLogResult.node,
      };

      return visitCurrentNode({
        node: nodeWithVisitedTaskLog,
        childPath: taskLogResult.recordedPath,
        childBubble: taskLogResult.bubble,
        visitNode: visitor.visitNagger,
      });
    }
  }

  return nodeNotFound(nagger);
}

function shouldVisitTaskLog(request: VisitRequest, taskLog: TaskLogTraversedNode): boolean {
  if (request.kind === "all") return true;

  switch (request.target.kind) {
    case "task-log":
      return request.target.id === taskLog.id;
    case "task-entry":
    case "task-item":
      return request.target.requiredAncestry.taskLogId === taskLog.id;
    default:
      return false;
  }
}
