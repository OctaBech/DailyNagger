import { isTaskEntry, type SelectedDeleteContext } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { EditorActionScope } from "./contracts";

export function editorDeleteSelectedNode(
  { memory }: EditorActionScope,
  deleteContext: SelectedDeleteContext,
): void {
  const { branch, tree } = treeOperations;
  const { freshTree, freshNode } = tree.readNode(memory, deleteContext.selectedNode);
  const result = isTaskEntry(freshNode)
    ? branch.deleteTaskEntry(freshTree, freshNode)
    : branch.deleteTaskItemSubtree(freshTree, freshNode);

  memory.write.setTreeAndSelectedPath(result.newTree, result.newPath);
}
