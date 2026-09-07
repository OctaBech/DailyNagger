import { normalizeTaskEntryValue, type TaskEntry } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { TaskInputRuntimeDependencies } from "./contracts";

export function taskEntrySetValue(
  args: {
    readonly taskEntry: TaskEntry;
    readonly newValue: string | null;
  },
  { memory, sending, interactionStamp }: TaskInputRuntimeDependencies,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshTaskEntry } = tree.readTaskEntry(memory, args.taskEntry);
  const normalizedValue = normalizeTaskEntryValue(freshTaskEntry.valueType, args.newValue);

  const taskEntryV1 = node.setTaskEntryValue(freshTaskEntry, normalizedValue);
  const stampedTaskEntry = interactionStamp.applyTo(taskEntryV1);

  const newTree = tree.replaceTaskEntry(freshTree, stampedTaskEntry);

  memory.write.setTree(newTree);

  sending.queue(stampedTaskEntry);
}
