import type { TaskItem } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { EditorRuntimeDependencies } from "./contracts";

export function editorTaskItemSetName(
  args: {
    readonly taskItem: TaskItem;
    readonly name: string;
  },
  { memory }: EditorRuntimeDependencies,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshTaskItem } = tree.readTaskItem(memory, args.taskItem);
  const taskItemV1 = node.setTaskItemName(freshTaskItem, args.name);
  const result = tree.replaceNode(freshTree, taskItemV1);

  memory.write.setTree(result.newTree);
}
