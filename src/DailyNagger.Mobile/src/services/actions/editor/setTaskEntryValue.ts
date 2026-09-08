import { normalizeTaskEntryValue, type TaskEntry } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { EditorRuntimeDependencies } from "./contracts";

export function editorTaskEntrySetValue(
  args: {
    readonly taskEntry: TaskEntry;
    readonly newValue: string | null;
  },
  { memory }: EditorRuntimeDependencies,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshTaskEntry } = tree.readTaskEntry(memory, args.taskEntry);
  const normalizedValue = normalizeTaskEntryValue(freshTaskEntry.valueType, args.newValue);

  const taskEntryV1 = node.setTaskEntryValue(freshTaskEntry, normalizedValue);
  const newTree = tree.replaceTaskEntry(freshTree, taskEntryV1);

  memory.write.setTree(newTree);
}
