import type { TaskEntry } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { NavigationActionScope } from "./contracts";

export function taskEntrySetFocused({ memory }: NavigationActionScope, taskEntry: TaskEntry): void {
  const { tree } = treeOperations;
  const { freshTree, freshTaskEntry } = tree.readTaskEntry(memory, taskEntry);
  const result = tree.replaceNode(freshTree, freshTaskEntry);

  memory.write.setTreeAndSelectedPath(result.newTree, result.newPath);
}
