import type { TaskEntry } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { EditorActionScope } from "./contracts";

export function editorTaskEntrySetTag(
  { memory }: EditorActionScope,
  taskEntry: TaskEntry,
  tag: string | null,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshTaskEntry } = tree.readTaskEntry(memory, taskEntry);
  const taskEntryV1 = node.setTaskEntryTag(freshTaskEntry, tag);
  const result = tree.replaceNode(freshTree, taskEntryV1);

  memory.write.setTreeAndSelectedPath(result.newTree, result.newPath);
}
