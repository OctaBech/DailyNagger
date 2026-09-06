import type { TaskItem } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { NavigationActionScope } from "./contracts";

export function taskItemSetExpanded(
  { memory }: NavigationActionScope,
  taskItem: TaskItem,
  isExpanded: boolean,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshTaskItem } = tree.readTaskItem(memory, taskItem);
  const taskItemV1 = node.setTaskItemExpanded(freshTaskItem, isExpanded);
  const result = tree.replaceNode(freshTree, taskItemV1);

  memory.write.setTreeAndSelectedPath(result.newTree, result.newPath);
}
