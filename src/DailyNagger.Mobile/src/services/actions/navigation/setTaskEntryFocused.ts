import type { TaskEntry } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { NavigationRuntimeDependencies } from "./contracts";

export function taskEntrySetFocused(
  args: {
    readonly taskEntry: TaskEntry;
  },
  { memory }: NavigationRuntimeDependencies,
): void {
  const { tree } = treeOperations;
  const { freshTree, freshTaskEntry } = tree.readTaskEntry(memory, args.taskEntry);
  const result = tree.replaceNode(freshTree, freshTaskEntry);

  memory.write.setTreeAndSelectedPath(result.newTree, result.newPath);
}


