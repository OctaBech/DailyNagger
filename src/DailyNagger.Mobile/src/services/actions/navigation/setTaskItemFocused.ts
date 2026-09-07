import type { TaskItem } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { NavigationRuntimeDependencies } from "./contracts";

export function taskItemSetFocused(
  args: {
    readonly taskItem: TaskItem;
  },
  { memory }: NavigationRuntimeDependencies,
): void {
  const { tree } = treeOperations;
  const { freshTree, freshTaskItem } = tree.readTaskItem(memory, args.taskItem);
  const result = tree.replaceNode(freshTree, freshTaskItem);

  memory.write.setTreeAndSelectedPath(result.newTree, result.newPath);
}

