import { normalizeTaskEntryValue, type TaskEntry } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { TaskInputActionScope } from "./contracts";

export function taskEntrySetValue(
  { memory, sending, interactionStamp }: TaskInputActionScope,
  taskEntry: TaskEntry,
  newValue: string | null,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshTaskEntry } = tree.readTaskEntry(memory, taskEntry);
  const normalizedValue = normalizeTaskEntryValue(freshTaskEntry.valueType, newValue);

  const taskEntryV1 = node.setTaskEntryValue(freshTaskEntry, normalizedValue);
  const stampedTaskEntry = interactionStamp.applyTo(taskEntryV1);

  const newTree = tree.replaceTaskEntry(freshTree, stampedTaskEntry);

  memory.write.setTree(newTree);

  sending.queue(stampedTaskEntry);
}
