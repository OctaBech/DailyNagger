import type { TaskItem, TaskEntry } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { EditorRuntimeDependencies } from "./contracts";

export function editorCopySelectedNode(
  { node }: { readonly node: TaskItem | TaskEntry },
  { memory, nodeClipboard, haptics }: EditorRuntimeDependencies,
): void {
  const { freshNode } = treeOperations.tree.readNode(memory, node);
  nodeClipboard.copy(freshNode);
  haptics.play("selection");
}
