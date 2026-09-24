import type { TaskItem } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { NavigationRuntimeDependencies } from "./contracts";

export function taskItemSetExpanded(
  args: {
    readonly taskItem: TaskItem;
    readonly isExpanded: boolean;
  },
  { memory }: NavigationRuntimeDependencies,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshTaskItem } = tree.readTaskItem(memory, args.taskItem);
  const taskItemV1 = node.setTaskItemExpanded(freshTaskItem, args.isExpanded);
  const result = tree.replaceNode(freshTree, taskItemV1);

  memory.write.setTreeAndSelectedPath(result.newTree, result.newPath);
}
