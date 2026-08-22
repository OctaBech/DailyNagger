import { type SelectedNodes, type TreePath } from "@/models";
import { selectedPathOperations } from "@/services/core-tree-operations";
import {
  selectedNodeContextOperations,
  type SelectedMoveContext,
} from "./selectedNodeContextOperations";

export const nodeReaderOperations = {
  canAddTaskEntryToSelectedNode,
  canSelectedNaggerBePinned,
  canSelectedNaggerBeUnpinned,
  canBePinned,
  canBeUnpinned,
  canDeleteSelectedNode,
  canMoveSelectedContextDown,
  canMoveSelectedContextUp,
  canMoveSelectedNodeDown,
  canMoveSelectedNodeUp,
} as const;

function canAddTaskEntryToSelectedNode(path: TreePath): boolean {
  const selectedNodeType = selectedPathOperations.tryGetSelectedNode(path)?.nodeType;
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
  return canSelectedNaggerBePinned(selectedPathOperations.deriveSelectedNodes(path));
}

function canBeUnpinned(path: TreePath): boolean {
  return canSelectedNaggerBeUnpinned(selectedPathOperations.deriveSelectedNodes(path));
}

function canDeleteSelectedNode(path: TreePath): boolean {
  return selectedNodeContextOperations.tryReadDeleteContext(path) !== null;
}

function canMoveSelectedNodeUp(path: TreePath): boolean {
  return canMoveSelectedContextUp(selectedNodeContextOperations.tryReadMoveContext(path));
}

function canMoveSelectedNodeDown(path: TreePath): boolean {
  return canMoveSelectedContextDown(selectedNodeContextOperations.tryReadMoveContext(path));
}

function canMoveSelectedContextUp(context: SelectedMoveContext | null): boolean {
  return context !== null && context.selectedIndex > 0;
}

function canMoveSelectedContextDown(context: SelectedMoveContext | null): boolean {
  return context !== null && context.selectedIndex < context.siblingCount - 1;
}
