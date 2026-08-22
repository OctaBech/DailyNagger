import type { TaskEntry, TaskItem, TaskLog, Tree, TreeNode, TreePath } from "@/models";
import { targets, type TargetVisitContext } from "./targets";

type BranchUpdateResult = {
  readonly newTree: Tree;
  readonly newPath: TreePath;
};

export const branch = {
  addTaskEntryToTaskItem,
  addTaskItemToTaskLog,
  addTaskItemToTaskItem,
  deleteTaskItemLeaf,
  replaceTaskItemAndUpdateDoneCounts,
  setFocusPath,
} as const;

function addTaskEntryToTaskItem(
  freshTree: Tree,
  parentTaskItem: TaskItem,
  newTaskEntry: TaskEntry,
): BranchUpdateResult {
  if (newTaskEntry.taskLogId !== parentTaskItem.taskLogId) {
    throw new Error(
      `TaskEntry '${newTaskEntry.id}' belongs to TaskLog '${newTaskEntry.taskLogId}', not '${parentTaskItem.taskLogId}'.`,
    );
  }

  if (newTaskEntry.parentTaskItemId !== parentTaskItem.id) {
    throw new Error(
      `TaskEntry '${newTaskEntry.id}' does not belong under TaskItem '${parentTaskItem.id}'.`,
    );
  }

  const result = targets.visitNode(freshTree, parentTaskItem, {
    visitTaskItem: (taskItem, context) => {
      if (!context.isTargetNode) return taskItem;

      return {
        ...taskItem,
        clientProps: {
          ...taskItem.clientProps,
          isExpanded: true,
        },
        taskEntries: [...taskItem.taskEntries, newTaskEntry],
      };
    },
  });

  if (result.kind === "not-found") {
    throw new Error(`TaskItem '${parentTaskItem.id}' was not found in the current tree.`);
  }

  return {
    newTree: result.node as Tree,
    newPath: [newTaskEntry, ...(result.recordedPath as TreePath)],
  };
}

function addTaskItemToTaskLog(
  freshTree: Tree,
  parentTaskLog: TaskLog,
  newTaskItem: TaskItem,
): BranchUpdateResult {
  if (newTaskItem.taskLogId !== parentTaskLog.id) {
    throw new Error(
      `TaskItem '${newTaskItem.id}' belongs to TaskLog '${newTaskItem.taskLogId}', not '${parentTaskLog.id}'.`,
    );
  }

  if (newTaskItem.parentTaskItemId !== null) {
    throw new Error(
      `TaskItem '${newTaskItem.id}' is not a root TaskItem for TaskLog '${parentTaskLog.id}'.`,
    );
  }

  const result = targets.visitNode(freshTree, parentTaskLog, {
    visitTaskLog: (taskLog, context) => {
      if (!context.isTargetNode) return taskLog;

      return {
        ...taskLog,
        descendantTaskItemCount: taskLog.descendantTaskItemCount + 1,
        taskItems: [...taskLog.taskItems, newTaskItem],
      };
    },
  });

  if (result.kind === "not-found") {
    throw new Error(`TaskLog '${parentTaskLog.id}' was not found in the current tree.`);
  }

  return {
    newTree: result.node as Tree,
    newPath: [newTaskItem, ...(result.recordedPath as TreePath)],
  };
}

function addTaskItemToTaskItem(
  freshTree: Tree,
  parentTaskItem: TaskItem,
  newTaskItem: TaskItem,
): BranchUpdateResult {
  if (newTaskItem.taskLogId !== parentTaskItem.taskLogId) {
    throw new Error(
      `TaskItem '${newTaskItem.id}' belongs to TaskLog '${newTaskItem.taskLogId}', not '${parentTaskItem.taskLogId}'.`,
    );
  }

  if (newTaskItem.parentTaskItemId !== parentTaskItem.id) {
    throw new Error(
      `TaskItem '${newTaskItem.id}' does not belong under TaskItem '${parentTaskItem.id}'.`,
    );
  }

  const result = targets.visitNode(freshTree, parentTaskItem, {
    visitTaskItem: (taskItem, context) => {
      if (context.isTargetNode) {
        return {
          ...taskItem,
          clientProps: {
            ...taskItem.clientProps,
            isExpanded: true,
          },
          descendantTaskItemCount: taskItem.descendantTaskItemCount + 1,
          taskItems: [...taskItem.taskItems, newTaskItem],
        };
      }

      return {
        ...taskItem,
        descendantTaskItemCount: taskItem.descendantTaskItemCount + 1,
      };
    },
    visitTaskLog: (taskLog) => {
      return {
        ...taskLog,
        descendantTaskItemCount: taskLog.descendantTaskItemCount + 1,
      };
    },
  });

  if (result.kind === "not-found") {
    throw new Error(`TaskItem '${parentTaskItem.id}' was not found in the current tree.`);
  }

  return {
    newTree: result.node as Tree,
    newPath: [newTaskItem, ...(result.recordedPath as TreePath)],
  };
}

function deleteTaskItemLeaf(freshTree: Tree, taskItemToDelete: TaskItem): BranchUpdateResult {
  if (taskItemToDelete.taskEntries.length > 0 || taskItemToDelete.taskItems.length > 0) {
    throw new Error(`TaskItem '${taskItemToDelete.id}' is not a leaf TaskItem.`);
  }

  const doneDelta = taskItemToDelete.isDone ? -1 : 0;

  const result = targets.visitNode(freshTree, taskItemToDelete, {
    visitTaskItem: (taskItem, context) => {
      if (context.isTargetNode) return taskItem;

      if (context.isTargetParent) {
        return {
          ...taskItem,
          descendantTaskItemCount: taskItem.descendantTaskItemCount - 1,
          doneDescendantTaskItemCount: taskItem.doneDescendantTaskItemCount + doneDelta,
          taskItems: taskItem.taskItems.filter(
            (childTaskItem) => childTaskItem.id !== taskItemToDelete.id,
          ),
        };
      }

      return {
        ...taskItem,
        descendantTaskItemCount: taskItem.descendantTaskItemCount - 1,
        doneDescendantTaskItemCount: taskItem.doneDescendantTaskItemCount + doneDelta,
      };
    },
    visitTaskLog: (taskLog, context) => {
      const updatedTaskLog = {
        ...taskLog,
        descendantTaskItemCount: taskLog.descendantTaskItemCount - 1,
        doneDescendantTaskItemCount: taskLog.doneDescendantTaskItemCount + doneDelta,
      };

      if (!context.isTargetParent) return updatedTaskLog;

      return {
        ...updatedTaskLog,
        taskItems: taskLog.taskItems.filter(
          (childTaskItem) => childTaskItem.id !== taskItemToDelete.id,
        ),
      };
    },
  });

  if (result.kind === "not-found") {
    throw new Error(`TaskItem '${taskItemToDelete.id}' was not found in the current tree.`);
  }

  return {
    newTree: result.node as Tree,
    newPath: result.recordedPath.slice(1) as TreePath,
  };
}

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

function setFocusPath(freshTree: Tree, node: TreeNode, hasFocus: boolean): BranchUpdateResult {
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
      isFocusParent: hasFocus && context.isTargetParent,
    },
  } as TNode;
}
