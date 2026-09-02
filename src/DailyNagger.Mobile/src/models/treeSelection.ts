import {
  isNagger,
  isTaskEntry,
  isTaskItem,
  isTaskLog,
  type SelectedNodes,
  type SelectedNodeType,
  type TreeNode,
  type TreePath,
} from "./nodeTypes";
import type { Nagger, TaskEntry, TaskItem, TaskLog } from "./clientModel";

export const treeSelection = {
  canAddTaskEntryToSelectedNode,
  canBePinned,
  canBeUnpinned,
  canDeleteSelectedNode,
  canMoveSelectedContextDown,
  canMoveSelectedContextUp,
  canMoveSelectedNodeDown,
  canMoveSelectedNodeUp,
  canSelectedNaggerBePinned,
  canSelectedNaggerBeUnpinned,
  deriveSelectedNodes,
  requireDeleteContext,
  requireMoveContext,
  requireSelectedNode,
  requireSelectedNodeAndParent,
  tryGetSelectedNode,
  tryGetSelectedNodeAndParent,
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
  TaskEntryInTaskItemContext | TaskItemInTaskItemContext | TaskItemInTaskLogContext;

export type SelectedDeleteContext = SelectedMoveContext;

type SelectedNodeAndParent = {
  readonly selectedNode: TreeNode;
  readonly parentNode: TreeNode;
};

function tryGetSelectedNode(selectedPath: TreePath): TreeNode | null {
  return selectedPath[0] ?? null;
}

function requireSelectedNode(selectedPath: TreePath): TreeNode {
  const selectedNode = tryGetSelectedNode(selectedPath);

  if (selectedNode === null) {
    throw new Error("Cannot read selected node because selected path is empty.");
  }

  return selectedNode;
}

function deriveSelectedNodes(selectedPath: TreePath): SelectedNodes {
  const selected: {
    selectedNodeType: SelectedNodeType;
    nagger: Nagger | null;
    taskLog: TaskLog | null;
    taskItem: TaskItem | null;
    taskEntry: TaskEntry | null;
  } = {
    selectedNodeType: selectedPath[0]?.nodeType ?? null,
    nagger: null,
    taskLog: null,
    taskItem: null,
    taskEntry: null,
  };

  for (const node of selectedPath) {
    if (selected.selectedNodeType === null && node.nodeType !== "NagPlan") {
      selected.selectedNodeType = node.nodeType;
    }

    if (isNagger(node) && selected.nagger === null) {
      selected.nagger = node;
      if (selected.taskLog === null) selected.taskLog = node.taskLog;
    }
    if (isTaskLog(node) && selected.taskLog === null) selected.taskLog = node;
    if (isTaskItem(node) && selected.taskItem === null) selected.taskItem = node;
    if (isTaskEntry(node) && selected.taskEntry === null) selected.taskEntry = node;
  }

  return selected;
}

function tryGetSelectedNodeAndParent(selectedPath: TreePath): SelectedNodeAndParent | null {
  const selectedNode = selectedPath[0];
  const parentNode = selectedPath[1];

  if (selectedNode === undefined) return null;
  if (parentNode === undefined) return null;

  return { selectedNode, parentNode };
}

function requireSelectedNodeAndParent(selectedPath: TreePath): SelectedNodeAndParent {
  const selectedNodeAndParent = tryGetSelectedNodeAndParent(selectedPath);

  if (selectedNodeAndParent === null) {
    throw new Error("Cannot read selected node and parent because selected path is too short.");
  }

  return selectedNodeAndParent;
}

function canAddTaskEntryToSelectedNode(path: TreePath): boolean {
  const selectedNodeType = tryGetSelectedNode(path)?.nodeType;
  return selectedNodeType === "TaskItem" || selectedNodeType === "TaskEntry";
}

function canSelectedNaggerBePinned(selectedNodes: SelectedNodes): boolean {
  return selectedNodes.nagger?.pinnedBy === "None";
}

function canSelectedNaggerBeUnpinned(selectedNodes: SelectedNodes): boolean {
  const nagger = selectedNodes.nagger;
  return nagger !== null && nagger.pinnedBy !== "None";
}

function canBePinned(path: TreePath): boolean {
  return canSelectedNaggerBePinned(deriveSelectedNodes(path));
}

function canBeUnpinned(path: TreePath): boolean {
  return canSelectedNaggerBeUnpinned(deriveSelectedNodes(path));
}

function canDeleteSelectedNode(path: TreePath): boolean {
  return tryReadDeleteContext(path) !== null;
}

function canMoveSelectedNodeUp(path: TreePath): boolean {
  return canMoveSelectedContextUp(tryReadMoveContext(path));
}

function canMoveSelectedNodeDown(path: TreePath): boolean {
  return canMoveSelectedContextDown(tryReadMoveContext(path));
}

function canMoveSelectedContextUp(context: SelectedMoveContext | null): boolean {
  return context !== null && context.selectedIndex > 0;
}

function canMoveSelectedContextDown(context: SelectedMoveContext | null): boolean {
  return context !== null && context.selectedIndex < context.siblingCount - 1;
}

function tryReadMoveContext(path: TreePath): SelectedMoveContext | null {
  const selectedNodeAndParent = tryGetSelectedNodeAndParent(path);
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
