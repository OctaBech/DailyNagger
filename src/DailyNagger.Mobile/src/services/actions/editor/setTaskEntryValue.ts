import { normalizeTaskEntryValue, type TaskEntry } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { EditorActionScope } from "./contracts";

export function editorTaskEntrySetValue(
  { memory }: EditorActionScope,
  taskEntry: TaskEntry,
  newValue: string | null,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshTaskEntry } = tree.readTaskEntry(memory, taskEntry);
  const normalizedValue = normalizeTaskEntryValue(freshTaskEntry.valueType, newValue);

  const taskEntryV1 = node.setTaskEntryValue(freshTaskEntry, normalizedValue);
  const newTree = tree.replaceTaskEntry(freshTree, taskEntryV1);

  memory.write.setTree(newTree);
}
