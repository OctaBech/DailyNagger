import type { TaskEntryTraversedNode } from "../../core-tree-operations/traversed-node/contracts";
import type { TreeVisitor, VisitRequest } from "./contracts";
import { isRequestTargetUnreachable } from "./targetMatching";
import { nodeNotFound, visitCurrentNode, type VisitResult } from "./visitResult";

export function visitNodeFromTaskEntry(
  taskEntry: TaskEntryTraversedNode,
  request: VisitRequest,
  visitor: TreeVisitor,
): VisitResult<TaskEntryTraversedNode> {
  if (isRequestTargetUnreachable(request, ["nagger", "task-log", "task-item"])) {
    return nodeNotFound(taskEntry);
  }

  if (requestTargetsTaskEntry(request, taskEntry)) {
    return visitCurrentNode({
      node: taskEntry,
      childPath: [],
      isTargetNode: true,
      visitNode: visitor.visitTaskEntry,
    });
  }

  return nodeNotFound(taskEntry);
}

function requestTargetsTaskEntry(
  request: VisitRequest,
  taskEntry: TaskEntryTraversedNode,
): boolean {
  if (request.kind !== "target") return false;
  if (request.target.kind !== "task-entry") return false;

  return (
    request.target.id === taskEntry.id &&
    request.target.requiredAncestry.taskLogId === taskEntry.taskLogId &&
    request.target.requiredAncestry.taskItemId === taskEntry.parentTaskItemId
  );
}
