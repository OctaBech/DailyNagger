import {
  type Tree,
  type Nagger,
  type TaskEntry,
  type TaskItem,
  type TaskLog,
  type TreePath,
  type TreeNode,
  type SelectedNodeType,
  type SelectedNodes,
  isNagPlan,
  isNagger,
  isTaskLog,
  isTaskItem,
  isTaskEntry,
} from "@/models";
import { treeMutationOperations } from "./treeMutationOperations";

export const selectedPathOperations = {
  deriveSelectedNodes,
  tryGetSelectedNode,
  requireSelectedNode,
  tryGetSelectedNodeAndParent,
  requireSelectedNodeAndParent,
  requireSelectedNagger,
  tryGetSelectedNagger,
  requireSelectedTaskLog,
  tryGetSelectedTaskLog,
  requireRefreshedPathToSelectedNode,
  refreshPathToNode,
  tryRefreshPathToNode,
} as const;

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

function requireSelectedNagger(selectedPath: TreePath): Nagger {
  const nagger = tryGetSelectedNagger(selectedPath);

  if (nagger === null) {
    throw new Error("Cannot read selected Nagger because selected path does not contain a Nagger.");
  }

  return nagger;
}

function tryGetSelectedNagger(selectedPath: TreePath): Nagger | null {
  return deriveSelectedNodes(selectedPath).nagger;
}

function requireSelectedTaskLog(selectedPath: TreePath): TaskLog {
  const taskLog = tryGetSelectedTaskLog(selectedPath);

  if (taskLog === null) {
    throw new Error(
      "Cannot read selected TaskLog because selected path does not contain a TaskLog.",
    );
  }

  return taskLog;
}

function tryGetSelectedTaskLog(selectedPath: TreePath): TaskLog | null {
  return deriveSelectedNodes(selectedPath).taskLog;
}

function requireRefreshedPathToSelectedNode(tree: Tree, selectedPath: TreePath): TreePath {
  const selectedNode = requireSelectedNode(selectedPath);
  const refreshedPath = tryRefreshPathToNode(tree, selectedNode);

  if (refreshedPath === null) {
    throw new Error(
      `Cannot refresh selected path because node type:${selectedNode.nodeType} id:${"id" in selectedNode ? selectedNode.id : "root"} was not found in the target tree.`,
    );
  }

  return refreshedPath;
}

function refreshPathToNode(tree: Tree, node: TreeNode): TreePath {
  const { replaceNagPlan, replaceNagger, replaceTaskLog, replaceTaskItem, replaceTaskEntry } =
    treeMutationOperations;

  if (isNagPlan(node)) return replaceNagPlan(tree, (nagPlan) => nagPlan).treePath;
  if (isNagger(node)) return replaceNagger(tree, node, (nagger) => nagger).treePath;
  if (isTaskLog(node)) return replaceTaskLog(tree, node, (taskLog) => taskLog).treePath;
  if (isTaskItem(node)) return replaceTaskItem(tree, node, (taskItem) => taskItem).treePath;
  if (isTaskEntry(node)) return replaceTaskEntry(tree, node, (taskEntry) => taskEntry).treePath;

  throw new Error("Cannot refresh path to unsupported node type.");
}

function tryRefreshPathToNode(tree: Tree, node: TreeNode): TreePath | null {
  try {
    return refreshPathToNode(tree, node);
  } catch {
    return null;
  }
}
