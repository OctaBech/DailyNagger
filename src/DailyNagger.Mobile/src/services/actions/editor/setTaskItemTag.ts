import type { TaskItem } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { EditorActionScope } from "./contracts";

export function editorTaskItemSetTag(
  { memory }: EditorActionScope,
  taskItem: TaskItem,
  tag: string | null,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshTaskItem } = tree.readTaskItem(memory, taskItem);
  const taskItemV1 = node.setTaskItemTag(freshTaskItem, tag);
  const result = tree.replaceNode(freshTree, taskItemV1);

  memory.write.setTreeAndSelectedPath(result.newTree, result.newPath);
}
