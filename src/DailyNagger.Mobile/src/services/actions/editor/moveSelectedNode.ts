import type { SelectedMoveContext } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { EditorRuntimeDependencies } from "./contracts";

type MoveDirection = "up" | "down";

export function moveSelectedNode(
  args: {
    readonly moveContext: SelectedMoveContext;
  },
  { memory }: EditorRuntimeDependencies,
  direction: MoveDirection,
): void {
  if (direction === "up" && args.moveContext.selectedIndex === 0) return;
  if (direction === "down" && args.moveContext.selectedIndex === args.moveContext.siblingCount - 1) return;

  const { node, tree } = treeOperations;
  const { freshTree, freshNode: parentNodeV1 } = tree.readNode(memory, args.moveContext.parentNode);
  const parentNodeV2 = node.moveChild(parentNodeV1, args.moveContext.selectedNode, direction);
  const result = tree.replaceNode(freshTree, parentNodeV2);

  memory.write.setTreeAndSelectedPath(result.newTree, [
    args.moveContext.selectedNode,
    ...result.newPath,
  ]);
}
