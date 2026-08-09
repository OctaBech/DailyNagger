import {
  isTaskEntry,
  isTaskItem,
  isTaskLog,
  type TaskEntry,
  type TaskItem,
  type TaskLog,
  type TreePath,
} from "@/models";
import { selectedPathOperations } from "@/services/core-tree-operations";

export const selectedNodeContextOperations = {
  requireDeleteContext,
  requireMoveContext,
  tryReadDeleteContext,
  tryReadMoveContext,
} as const;

type TaskEntryInTaskItemContext = {
  readonly kind: "task-entry-in-task-item";
  readonly selectedNode: TaskEntry;
  readonly parentNode: TaskItem;
  readonly selectedIndex: number;
  readonly siblingCount: number;
};

type TaskItemInTaskItemContext = {
  readonly kind: "task-item-in-task-item";
  readonly selectedNode: TaskItem;
  readonly parentNode: TaskItem;
  readonly selectedIndex: number;
  readonly siblingCount: number;
};

type TaskItemInTaskLogContext = {
  readonly kind: "task-item-in-task-log";
  readonly selectedNode: TaskItem;
  readonly parentNode: TaskLog;
  readonly selectedIndex: number;
  readonly siblingCount: number;
};

export type SelectedMoveContext =
  | TaskEntryInTaskItemContext
  | TaskItemInTaskItemContext
  | TaskItemInTaskLogContext;

export type SelectedDeleteContext = SelectedMoveContext;

function tryReadMoveContext(path: TreePath): SelectedMoveContext | null {
  const selectedNodeAndParent = selectedPathOperations.tryGetSelectedNodeAndParent(path);
  if (selectedNodeAndParent === null) return null;

  const { selectedNode, parentNode } = selectedNodeAndParent;

  if (isTaskEntry(selectedNode) && isTaskItem(parentNode)) {
    return {
      kind: "task-entry-in-task-item",
      selectedNode,
      parentNode,
      selectedIndex: parentNode.taskEntries.findIndex((node) => node.id === selectedNode.id),
      siblingCount: parentNode.taskEntries.length,
    };
  }

  if (isTaskItem(selectedNode) && isTaskItem(parentNode)) {
    return {
      kind: "task-item-in-task-item",
      selectedNode,
      parentNode,
      selectedIndex: parentNode.taskItems.findIndex((node) => node.id === selectedNode.id),
      siblingCount: parentNode.taskItems.length,
    };
  }

  if (isTaskItem(selectedNode) && isTaskLog(parentNode)) {
    return {
      kind: "task-item-in-task-log",
      selectedNode,
      parentNode,
      selectedIndex: parentNode.taskItems.findIndex((node) => node.id === selectedNode.id),
      siblingCount: parentNode.taskItems.length,
    };
  }

  return null;
}

function requireMoveContext(path: TreePath): SelectedMoveContext {
  const context = tryReadMoveContext(path);

  if (context === null) {
    throw new Error("Cannot read selected move context from the current selected path.");
  }

  return context;
}

function tryReadDeleteContext(path: TreePath): SelectedDeleteContext | null {
  return tryReadMoveContext(path);
}

function requireDeleteContext(path: TreePath): SelectedDeleteContext {
  const context = tryReadDeleteContext(path);

  if (context === null) {
    throw new Error("Cannot read selected delete context from the current selected path.");
  }

  return context;
}
