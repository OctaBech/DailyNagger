import type { TaskEntryTraversedNode, TaskItemTraversedNode } from "./traversed-node";
import type { TreeVisitor, VisitRequest } from "./contracts";
import { isRequestTargetUnreachable } from "./targetMatching";
import { visitArrayNodes } from "./visitArray";
import { visitNodeFromTaskEntry } from "./visitNodeFromTaskEntry";
import { nodeNotFound, visitCurrentNode, type VisitBubble, type VisitResult } from "./visitResult";

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
      collectedChildNodes: [],
      isTargetNode: true,
      visitNode: visitor.visitTaskItem,
      allowIdentityChange: request.kind === "whole-tree" && request.allowIdentityChange === true,
    });
  }

  const taskEntriesResult = visitArrayNodes({
    request,
    shouldVisitArray: shouldVisitTaskEntries(request, taskItem),
    ownerNode: taskItem,
    initialCollectedNodes: [],
    nodes: taskItem.taskEntries,
    shouldVisitNode: (taskEntry) => shouldVisitTaskEntry(request, taskEntry),
    visitNode: (taskEntry) => visitNodeFromTaskEntry(taskEntry, request, visitor),
  });

  const taskItemsResult = visitArrayNodes({
    request,
    shouldVisitArray: shouldVisitChildTaskItems(request, taskItem),
    ownerNode: taskItem,
    initialCollectedNodes: [],
    nodes: taskItem.taskItems,
    shouldVisitNode: () => true,
    visitNode: (childTaskItem) => visitNodeFromTaskItem(childTaskItem, request, visitor),
  });

  if (!taskEntriesResult.wasVisited && !taskItemsResult.wasVisited) return nodeNotFound(taskItem);

  const indexHint = taskItemsResult.wasVisited
    ? taskItemsResult.indexHint
    : taskEntriesResult.indexHint;
  const newTaskItem = {
    ...taskItem,
    taskEntries: taskEntriesResult.nodes,
    taskItems: taskItemsResult.nodes,
    clientProps: { ...taskItem.clientProps, indexHint },
  };

  const childBubble: VisitBubble = taskItemsResult.wasVisited
    ? taskItemsResult.bubble
    : taskEntriesResult.bubble;

  return visitCurrentNode({
    node: newTaskItem,
    collectedChildNodes: [
      ...taskItemsResult.collectedNodes,
      ...taskEntriesResult.collectedNodes,
    ],
    childBubble,
    visitNode: visitor.visitTaskItem,
    allowIdentityChange: request.kind === "whole-tree" && request.allowIdentityChange === true,
  });
}

function shouldVisitTaskEntry(request: VisitRequest, taskEntry: TaskEntryTraversedNode): boolean {
  if (request.kind === "whole-tree") return true;
  if (request.target.kind !== "task-entry") return false;

  return request.target.id === taskEntry.id;
}

function shouldVisitTaskEntries(request: VisitRequest, taskItem: TaskItemTraversedNode): boolean {
  if (request.kind === "whole-tree") return true;
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
  if (request.kind === "whole-tree") return true;
  if (request.target.kind !== "task-entry") return true;
  return (
    request.target.requiredAncestry.taskLogId === taskItem.taskLogId &&
    request.target.requiredAncestry.taskItemId !== taskItem.id
  );
}

function requestTargetsTaskItem(request: VisitRequest, taskItem: TaskItemTraversedNode): boolean {
  if (request.kind !== "target") return false;
  if (request.target.kind !== "task-item") return false;

  return (
    request.target.id === taskItem.id &&
    request.target.requiredAncestry.taskLogId === taskItem.taskLogId &&
    request.target.requiredAncestry.parentTaskItemId === taskItem.parentTaskItemId
  );
}

