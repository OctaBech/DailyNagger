import { isTaskEntry, type SelectedDeleteContext, type SelectedMoveContext } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { Memory } from "../memory";

type EditorActionScope = {
  readonly memory: Memory;
};

type MoveDirection = "up" | "down";

export function editorMoveSelectedNodeUp(
  scope: EditorActionScope,
  moveContext: SelectedMoveContext,
): void {
  moveSelectedNode(scope, moveContext, "up");
}

export function editorMoveSelectedNodeDown(
  scope: EditorActionScope,
  moveContext: SelectedMoveContext,
): void {
  moveSelectedNode(scope, moveContext, "down");
}

function moveSelectedNode(
  { memory }: EditorActionScope,
  moveContext: SelectedMoveContext,
  direction: MoveDirection,
): void {
  if (direction === "up" && moveContext.selectedIndex === 0) return;
  if (direction === "down" && moveContext.selectedIndex === moveContext.siblingCount - 1) return;

  const { node, tree } = treeOperations;
  const { freshTree, freshNode: parentNodeV1 } = tree.readNode(memory, moveContext.parentNode);
  const parentNodeV2 = node.moveChild(parentNodeV1, moveContext.selectedNode, direction);
  const result = tree.replaceNode(freshTree, parentNodeV2);

  memory.write.setTreeAndSelectedPath(result.newTree, [
    moveContext.selectedNode,
    ...result.newPath,
  ]);
}

export function editorDeleteSelectedNode(
  { memory }: EditorActionScope,
  deleteContext: SelectedDeleteContext,
): void {
  const { branch } = treeOperations;
  const currentTree = memory.read.getTree();
  const result = isTaskEntry(deleteContext.selectedNode)
    ? branch.deleteTaskEntry(currentTree, deleteContext.selectedNode)
    : branch.deleteTaskItemLeaf(currentTree, deleteContext.selectedNode);

  memory.write.setTreeAndSelectedPath(result.newTree, result.newPath);
}
