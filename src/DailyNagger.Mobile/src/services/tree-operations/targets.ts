import type { Nagger, TaskEntry, TaskItem, TaskLog, Tree, TreeNode } from "@/models";
import { isNagger, isTaskEntry, isTaskItem, isTaskLog } from "@/models";
import type {
  NaggerTraversedNode,
  NagPlanTraversedNode,
  TaskEntryTraversedNode,
  TaskItemTraversedNode,
  TaskLogTraversedNode,
} from "../core-tree-operations/traversed-node/contracts";
import type {
  NaggerTarget,
  TaskEntryTarget,
  TaskItemTarget,
  TaskLogTarget,
  TreeVisitor,
  TreeTarget,
  VisitContext,
  VisitRequest,
} from "./tree-visitor/contracts";
import { visitNodeFromNagPlan } from "./tree-visitor/visitNodeFromNagPlan";
import type { VisitResult } from "./tree-visitor/visitResult";

export type TargetVisitContext = VisitContext;

type TargetVisitor = {
  readonly visitNagger?: (nagger: Nagger, context: TargetVisitContext) => Nagger;
  readonly visitTaskLog?: (taskLog: TaskLog, context: TargetVisitContext) => TaskLog;
  readonly visitTaskItem?: (taskItem: TaskItem, context: TargetVisitContext) => TaskItem;
  readonly visitTaskEntry?: (taskEntry: TaskEntry, context: TargetVisitContext) => TaskEntry;
};

export const targets = {
  fromTaskItem,
  visitNode,
} as const;

function visitNode(
  fromTree: Tree,
  toNode: Exclude<TreeNode, Tree>,
  visitor: TargetVisitor,
): VisitResult<NagPlanTraversedNode> {
  return visitNodeFromNagPlan(
    fromTree as NagPlanTraversedNode,
    createVisitRequest(fromTree, toNode),
    toTreeVisitor(visitor),
  );
}

function fromTaskItem(freshTree: Tree, taskItem: TaskItem): TaskItemTarget {
  return createTaskItemTarget(freshTree, taskItem);
}

function createVisitRequest(freshTree: Tree, node: Exclude<TreeNode, Tree>): VisitRequest {
  return {
    kind: "target",
    target: createTarget(freshTree, node),
  };
}

function createTarget(freshTree: Tree, node: Exclude<TreeNode, Tree>): TreeTarget {
  if (isNagger(node)) return createNaggerTarget(node);
  if (isTaskLog(node)) return createTaskLogTarget(node);
  if (isTaskItem(node)) return createTaskItemTarget(freshTree, node);
  if (isTaskEntry(node)) return createTaskEntryTarget(freshTree, node);

  throw new Error("Unsupported target node type.");
}

function createNaggerTarget(nagger: Nagger): NaggerTarget {
  return {
    kind: "nagger",
    id: nagger.id,
  };
}

function createTaskLogTarget(taskLog: TaskLog): TaskLogTarget {
  return {
    kind: "task-log",
    id: taskLog.id,
    requiredAncestry: {
      naggerId: taskLog.nagId,
    },
  };
}

function createTaskItemTarget(freshTree: Tree, taskItem: TaskItem): TaskItemTarget {
  const nagger = freshTree.nags.find((candidate) => {
    return candidate.taskLog.id === taskItem.taskLogId;
  });

  if (nagger === undefined) {
    throw new Error(
      `Cannot create TaskItem target for '${taskItem.id}' because TaskLog '${taskItem.taskLogId}' is not in the current tree.`,
    );
  }

  return {
    kind: "task-item",
    id: taskItem.id,
    requiredAncestry: {
      naggerId: nagger.id,
      taskLogId: taskItem.taskLogId,
      parentTaskItemId: taskItem.parentTaskItemId,
    },
  };
}

function createTaskEntryTarget(freshTree: Tree, taskEntry: TaskEntry): TaskEntryTarget {
  const nagger = freshTree.nags.find((candidate) => {
    return candidate.taskLog.id === taskEntry.taskLogId;
  });

  if (nagger === undefined) {
    throw new Error(
      `Cannot create TaskEntry target for '${taskEntry.id}' because TaskLog '${taskEntry.taskLogId}' is not in the current tree.`,
    );
  }

  return {
    kind: "task-entry",
    id: taskEntry.id,
    requiredAncestry: {
      naggerId: nagger.id,
      taskLogId: taskEntry.taskLogId,
      taskItemId: taskEntry.parentTaskItemId,
    },
  };
}

function toTreeVisitor(visitor: TargetVisitor): TreeVisitor {
  return {
    visitNagger:
      visitor.visitNagger === undefined
        ? undefined
        : (nagger, context) => {
            return visitor.visitNagger?.(nagger as Nagger, context) as NaggerTraversedNode;
          },
    visitTaskLog:
      visitor.visitTaskLog === undefined
        ? undefined
        : (taskLog, context) => {
            return visitor.visitTaskLog?.(taskLog as TaskLog, context) as TaskLogTraversedNode;
          },
    visitTaskItem:
      visitor.visitTaskItem === undefined
        ? undefined
        : (taskItem, context) => {
            return visitor.visitTaskItem?.(taskItem as TaskItem, context) as TaskItemTraversedNode;
          },
    visitTaskEntry:
      visitor.visitTaskEntry === undefined
        ? undefined
        : (taskEntry, context) => {
            return visitor.visitTaskEntry?.(taskEntry as TaskEntry, context) as TaskEntryTraversedNode;
          },
  };
}
