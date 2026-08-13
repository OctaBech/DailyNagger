import type {
  TaskItemTraversedNode,
  TaskLogTraversedNode,
} from "../../core-tree-operations/traversed-node/contracts";
import type { TreeVisitor, VisitRequest } from "./contracts";
import { isRequestTargetUnreachable, requestTargetsKind } from "./targetMatching";
import { visitArrayNodes } from "./visitArray";
import { visitNodeFromTaskItem } from "./visitNodeFromTaskItem";
import { nodeNotFound, visitCurrentNode, type VisitResult } from "./visitResult";

export function visitNodeFromTaskLog(
  taskLog: TaskLogTraversedNode,
  request: VisitRequest,
  visitor: TreeVisitor,
): VisitResult<TaskLogTraversedNode> {
  if (isRequestTargetUnreachable(request, ["nagger"])) return nodeNotFound(taskLog);

  if (requestTargetsKind(request, "task-log", taskLog.id)) {
    return visitCurrentNode({
      node: taskLog,
      childPath: [],
      isTargetNode: true,
      visitNode: visitor.visitTaskLog,
    });
  }

  const taskItemsResult = visitArrayNodes({
    request,
    ownerNode: taskLog,
    ownerPath: [],
    nodes: taskLog.taskItems,
    shouldVisitNode: () => true,
    visitNode: (taskItem) => visitNodeFromTaskItem(taskItem, request, visitor),
  });

  if (taskItemsResult.kind === "visited") {
    const nodeWithVisitedTaskItems = withTaskItems(
      taskLog,
      taskItemsResult.nodes,
      taskItemsResult.indexFound,
    );

    return visitCurrentNode({
      node: nodeWithVisitedTaskItems,
      childPath: taskItemsResult.recordedPath,
      childBubble: taskItemsResult.bubble,
      visitNode: visitor.visitTaskLog,
    });
  }

  return nodeNotFound(taskLog);
}

function withTaskItems(
  taskLog: TaskLogTraversedNode,
  taskItems: readonly TaskItemTraversedNode[],
  indexHint: number,
): TaskLogTraversedNode {
  return {
    ...taskLog,
    taskItems,
    clientProps: { ...taskLog.clientProps, indexHint },
  };
}
