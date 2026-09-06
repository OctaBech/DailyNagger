import type { TaskItem } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { NavigationActionScope } from "./contracts";

export function taskItemSetFocused({ memory }: NavigationActionScope, taskItem: TaskItem): void {
  const { tree } = treeOperations;
  const { freshTree, freshTaskItem } = tree.readTaskItem(memory, taskItem);
  const result = tree.replaceNode(freshTree, freshTaskItem);

  memory.write.setTreeAndSelectedPath(result.newTree, result.newPath);
}
