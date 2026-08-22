import {
  isTaskItem,
  isTaskLog,
  type TaskItem,
  type TaskLog,
  type Tree,
  type TreePath,
} from "@/models";
import { selectedPathOperations } from "./selectedPathOperations";
import { treeMutationOperations } from "./treeMutationOperations";

export const branchOperations = {
  setTaskItemDoneAndUpdateCounts,
};

type Delta = number;

type SetTaskItemDoneAndUpdateCountsResult = {
  readonly tree: Tree;
  readonly treePath: TreePath;
  readonly taskLog: TaskLog;
};

export function setTaskItemDoneAndUpdateCounts(
  tree: Tree,
  updatedTaskItem: TaskItem,
  delta: Delta,
): SetTaskItemDoneAndUpdateCountsResult {
  const { tree: treeWithUpdatedTaskItem, treePath } = treeMutationOperations.replaceTaskItem(
    tree,
    updatedTaskItem,
    (taskItem) => {
      return {
        ...taskItem,
        isDone: updatedTaskItem.isDone,
        interactionAt: updatedTaskItem.interactionAt,
        interactionTimeZone: updatedTaskItem.interactionTimeZone,
        interactionLocale: updatedTaskItem.interactionLocale,
        interactionMood: updatedTaskItem.interactionMood,
        interactionMoodAt: updatedTaskItem.interactionMoodAt,
      };
    },
  );

  const parentPath = treePath.slice(1);
  const treeWithUpdatedCounts = updateDoneDescendantTaskItemCount(
    treeWithUpdatedTaskItem,
    parentPath,
    delta,
  );
  const refreshedTreePath = selectedPathOperations.refreshPathToNode(
    treeWithUpdatedCounts,
    updatedTaskItem,
  );
  const { taskLog } = selectedPathOperations.deriveSelectedNodes(refreshedTreePath);

  if (taskLog === null) {
    throw new Error("Cannot update TaskItem done state because the refreshed path has no TaskLog.");
  }

  return {
    tree: treeWithUpdatedCounts,
    treePath: refreshedTreePath,
    taskLog,
  };
}

function updateDoneDescendantTaskItemCount(tree: Tree, selectedPath: TreePath, delta: Delta) {
  let newTree = tree;

  for (const node of selectedPath) {
    if (isTaskItem(node)) {
      newTree = treeMutationOperations.replaceTaskItem(newTree, node as TaskItem, (taskItem) => {
        return {
          ...taskItem,
          doneDescendantTaskItemCount: taskItem.doneDescendantTaskItemCount + delta,
        };
      }).tree;
      continue;
    }

    if (isTaskLog(node)) {
      newTree = treeMutationOperations.replaceTaskLog(newTree, node, (taskLog) => {
        return {
          ...taskLog,
          doneDescendantTaskItemCount: taskLog.doneDescendantTaskItemCount + delta,
        };
      }).tree;
      return newTree;
    }
  }

  throw new Error(
    "Cannot update done descendant task item count because selected path does not contain the owning TaskLog.",
  );
}
