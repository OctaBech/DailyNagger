import type {
  TaskEntryTraversedNode,
  TaskItemTraversedNode,
  TraversedNode,
} from "../../core-tree-operations/traversed-node/contracts";
import type { TreeVisitor, VisitRequest } from "./contracts";
import { isRequestTargetUnreachable } from "./targetMatching";
import { visitArrayNodes } from "./visitArray";
import { visitNodeFromTaskEntry } from "./visitNodeFromTaskEntry";
import { nodeNotFound, visitCurrentNode, type VisitResult } from "./visitResult";

export function visitNodeFromTaskItem(
  taskItem: TaskItemTraversedNode,
  request: VisitRequest,
  visitor: TreeVisitor,
): VisitResult<TaskItemTraversedNode> {
  if (isRequestTargetUnreachable(request, ["nagger", "task-log"])) {
    return nodeNotFound(taskItem);
  }

  if (requestTargetsTaskItem(request, taskItem)) {
    return visitCurrentNode({
      node: taskItem,
      childPath: [],
      isTargetNode: true,
      visitNode: visitor.visitTaskItem,
    });
  }

  let newTaskItem = taskItem;
  let newPath: TraversedNode[] = [];

  if (shouldVisitTaskEntries(request, taskItem)) {
    const result = visitArrayNodes({
      request,
      ownerNode: newTaskItem,
      ownerPath: [],
      nodes: newTaskItem.taskEntries,
      shouldVisitNode: (taskEntry) => shouldVisitTaskEntry(request, taskEntry),
      visitNode: (taskEntry) => visitNodeFromTaskEntry(taskEntry, request, visitor),
    });
    if (result.kind === "visited") {
      newTaskItem = withTaskEntries(newTaskItem, result.nodes, result.indexFound);
      newPath = [...result.recordedPath];
      return visitCurrentNode({
        node: newTaskItem,
        childPath: newPath,
        childBubble: result.bubble,
        visitNode: visitor.visitTaskItem,
      });
    }
  }

  if (shouldVisitChildTaskItems(request, taskItem)) {
    const result = visitArrayNodes({
      request,
      ownerNode: newTaskItem,
      ownerPath: [],
      nodes: newTaskItem.taskItems,
      shouldVisitNode: () => true,
      visitNode: (childTaskItem) => visitNodeFromTaskItem(childTaskItem, request, visitor),
    });
    if (result.kind === "visited") {
      newTaskItem = withTaskItems(newTaskItem, result.nodes, result.indexFound);
      newPath = [...result.recordedPath, ...newPath];
      return visitCurrentNode({
        node: newTaskItem,
        childPath: newPath,
        childBubble: result.bubble,
        visitNode: visitor.visitTaskItem,
      });
    }
  }

  return nodeNotFound(taskItem);
}

function shouldVisitTaskEntry(request: VisitRequest, taskEntry: TaskEntryTraversedNode): boolean {
  if (request.kind === "all") return true;
  if (request.target.kind !== "task-entry") return false;

  return request.target.id === taskEntry.id;
}

function shouldVisitTaskEntries(request: VisitRequest, taskItem: TaskItemTraversedNode): boolean {
  if (request.kind === "all") return true;
  if (request.target.kind !== "task-entry") return false;

  return (
    request.target.requiredAncestry.taskLogId === taskItem.taskLogId &&
    request.target.requiredAncestry.taskItemId === taskItem.id
  );
}

function shouldVisitChildTaskItems(
  request: VisitRequest,
  taskItem: TaskItemTraversedNode,
): boolean {
  if (request.kind === "all") return true;
  if (request.target.kind !== "task-entry") return true;
  return (
    request.target.requiredAncestry.taskLogId === taskItem.taskLogId &&
    request.target.requiredAncestry.taskItemId !== taskItem.id
  );
}

function requestTargetsTaskItem(
  request: VisitRequest,
  taskItem: TaskItemTraversedNode,
): boolean {
  if (request.kind !== "target") return false;
  if (request.target.kind !== "task-item") return false;

  return (
    request.target.id === taskItem.id &&
    request.target.requiredAncestry.taskLogId === taskItem.taskLogId &&
    request.target.requiredAncestry.parentTaskItemId === taskItem.parentTaskItemId
  );
}

function withTaskItems(
  taskItem: TaskItemTraversedNode,
  taskItems: readonly TaskItemTraversedNode[],
  indexHint: number,
): TaskItemTraversedNode {
  return {
    ...taskItem,
    taskItems,
    clientProps: { ...taskItem.clientProps, indexHint },
  };
}

function withTaskEntries(
  taskItem: TaskItemTraversedNode,
  taskEntries: readonly TaskEntryTraversedNode[],
  indexHint: number,
): TaskItemTraversedNode {
  return {
    ...taskItem,
    taskEntries,
    clientProps: { ...taskItem.clientProps, indexHint },
  };
}
