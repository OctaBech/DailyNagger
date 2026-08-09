import type { TaskItem, Tree, TreeNode, TreePath } from "@/models";
import { targets, type TargetVisitContext } from "./targets";

type BranchUpdateResult = {
  readonly newTree: Tree;
  readonly newPath: TreePath;
};

export const branch = {
  replaceTaskItemAndUpdateDoneCounts,
  setFocusPath,
} as const;

function replaceTaskItemAndUpdateDoneCounts(
  freshTree: Tree,
  updatedTaskItem: TaskItem,
): BranchUpdateResult {
  const doneDelta = updatedTaskItem.isDone ? 1 : -1;

  const result = targets.visitNode(freshTree, updatedTaskItem, {
      visitTaskItem: (taskItem, context) => {
        if (context.isTargetNode) {
          if (updatedTaskItem.isDone === taskItem.isDone) {
            throw new Error(
              `TaskItem '${updatedTaskItem.id}' already has isDone '${updatedTaskItem.isDone}'.`,
            );
          }
          return { ...updatedTaskItem };
        }
      return {
        ...taskItem,
        doneDescendantTaskItemCount: taskItem.doneDescendantTaskItemCount + doneDelta,
      };
    },
    visitTaskLog: (taskLog) => {
      return {
        ...taskLog,
        doneDescendantTaskItemCount: taskLog.doneDescendantTaskItemCount + doneDelta,
      };
    },
  });

  if (result.kind === "not-found") {
    throw new Error(`TaskItem '${updatedTaskItem.id}' was not found in the current tree.`);
  }

  return {
    newTree: result.node as Tree,
    newPath: result.recordedPath as TreePath,
  };
}

function setFocusPath(
  freshTree: Tree,
  node: TreeNode,
  hasFocus: boolean,
): BranchUpdateResult {
  if (node.nodeType === "NagPlan") {
    throw new Error("NagPlan focus path is not supported.");
  }

  const result = targets.visitNode(freshTree, node, {
    visitNagger: (nagger, context) => {
      return setIndividualNodeFocus(nagger, context, hasFocus);
    },
    visitTaskEntry: (taskEntry, context) => {
      return setIndividualNodeFocus(taskEntry, context, hasFocus);
    },
    visitTaskItem: (taskItem, context) => {
      return setIndividualNodeFocus(taskItem, context, hasFocus);
    },
    visitTaskLog: (taskLog, context) => {
      return setIndividualNodeFocus(taskLog, context, hasFocus);
    },
  });

  if (result.kind === "not-found") {
    throw new Error(`${node.nodeType} '${node.id}' was not found in the current tree.`);
  }

  return {
    newTree: result.node as Tree,
    newPath: result.recordedPath as TreePath,
  };
}

function setIndividualNodeFocus<TNode extends TreeNode>(
  node: TNode,
  context: TargetVisitContext,
  hasFocus: boolean,
): TNode {
  return {
    ...node,
    clientProps: {
      ...node.clientProps,
      isSelected: hasFocus,
      hasFocus: hasFocus && context.isTargetNode,
    },
  } as TNode;
}
