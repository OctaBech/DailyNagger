import type { TaskItem } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { EditorActionScope } from "./contracts";

export function editorTaskItemSetName(
  { memory }: EditorActionScope,
  taskItem: TaskItem,
  name: string,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshTaskItem } = tree.readTaskItem(memory, taskItem);
  const taskItemV1 = node.setTaskItemName(freshTaskItem, name);
  const result = tree.replaceNode(freshTree, taskItemV1);

  memory.write.setTree(result.newTree);
}
