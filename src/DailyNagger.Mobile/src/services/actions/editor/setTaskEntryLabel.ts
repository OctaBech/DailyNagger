import type { TaskEntry } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { EditorActionScope } from "./contracts";

export function editorTaskEntrySetLabel(
  { memory }: EditorActionScope,
  taskEntry: TaskEntry,
  label: string,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshTaskEntry } = tree.readTaskEntry(memory, taskEntry);
  const taskEntryV1 = node.setTaskEntryLabel(freshTaskEntry, label);
  const result = tree.replaceNode(freshTree, taskEntryV1);

  memory.write.setTree(result.newTree);
}
