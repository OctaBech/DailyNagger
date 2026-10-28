import { isTaskEntry, type SelectedDeleteContext } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { EditorRuntimeDependencies } from "./contracts";

export function editorDeleteSelectedNode(
  args: {
    readonly deleteContext: SelectedDeleteContext;
  },
  { memory, undoHistory, haptics }: EditorRuntimeDependencies,
): void {
  undoHistory.record(memory.read.getTreeAndSelectedPath());

  const { branch, tree } = treeOperations;
  const { freshTree, freshNode } = tree.readNode(memory, args.deleteContext.selectedNode);
  const result = isTaskEntry(freshNode)
    ? branch.deleteTaskEntry(freshTree, freshNode)
    : branch.deleteTaskItemSubtree(freshTree, freshNode);

  memory.write.setTreeAndSelectedPath(result.newTree, result.newPath);
  haptics.play("warning");
}
