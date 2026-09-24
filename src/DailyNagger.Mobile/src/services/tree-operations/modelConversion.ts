import { targets } from "./tree-visitor";
import type {
  NaggerTraversedNode,
  NagPlanTraversedNode,
  TaskEntryTraversedNode,
  TaskItemTraversedNode,
  TaskLogTraversedNode,
} from "./tree-visitor/traversed-node";

type ReplaceAllNodesVisitor = {
  readonly replaceNagPlan: (nagPlan: NagPlanTraversedNode) => NagPlanTraversedNode;
  readonly replaceNagger: (nagger: NaggerTraversedNode) => NaggerTraversedNode;
  readonly replaceTaskLog: (taskLog: TaskLogTraversedNode) => TaskLogTraversedNode;
  readonly replaceTaskItem: (taskItem: TaskItemTraversedNode) => TaskItemTraversedNode;
  readonly replaceTaskEntry: (taskEntry: TaskEntryTraversedNode) => TaskEntryTraversedNode;
};

type ReplaceAllNodesFromTaskLogVisitor = {
  readonly replaceTaskLog: (taskLog: TaskLogTraversedNode) => TaskLogTraversedNode;
  readonly replaceTaskItem: (taskItem: TaskItemTraversedNode) => TaskItemTraversedNode;
  readonly replaceTaskEntry: (taskEntry: TaskEntryTraversedNode) => TaskEntryTraversedNode;
};

export const modelConversion = {
  replaceAllNodes,
  replaceAllNodesFromTaskLog,
} as const;

function replaceAllNodes<TIn extends NagPlanTraversedNode, TOut extends NagPlanTraversedNode>(
  tree: TIn,
  visitor: ReplaceAllNodesVisitor,
): TOut {
  const result = targets.visitWholeTree(tree, {
    visitNagPlan: visitor.replaceNagPlan,
    visitNagger: visitor.replaceNagger,
    visitTaskLog: visitor.replaceTaskLog,
    visitTaskItem: visitor.replaceTaskItem,
    visitTaskEntry: visitor.replaceTaskEntry,
  });

  if (result.kind === "not-found") {
    throw new Error("Cannot replace all tree nodes because the tree root was not visited.");
  }

  return result.node as TOut;
}

function replaceAllNodesFromTaskLog<
  TIn extends TaskLogTraversedNode,
  TOut extends TaskLogTraversedNode,
>(taskLog: TIn, visitor: ReplaceAllNodesFromTaskLogVisitor): TOut {
  const result = targets.visitWholeTaskLog(taskLog, {
    visitTaskLog: visitor.replaceTaskLog,
    visitTaskItem: visitor.replaceTaskItem,
    visitTaskEntry: visitor.replaceTaskEntry,
  });

  if (result.kind === "not-found") {
    throw new Error("Cannot replace TaskLog subtree nodes because the TaskLog was not visited.");
  }

  return result.node as TOut;
}
