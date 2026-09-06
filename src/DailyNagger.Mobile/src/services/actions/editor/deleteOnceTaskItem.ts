import type { TaskItem } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { EditorActionScope } from "./contracts";

export function editorDeleteOnceTaskItem(
  { memory }: EditorActionScope,
  staleTaskItem: TaskItem,
): void {
  const { tree, branch } = treeOperations;
  const { freshTree, freshTaskItem } = tree.readTaskItem(memory, staleTaskItem);

  if (freshTaskItem.rolloverBehavior !== "RemoveWhenDone") {
    throw new Error(`TaskItem '${freshTaskItem.id}' is not a once TaskItem.`);
  }

  if (freshTaskItem.isDone) {
    throw new Error(`TaskItem '${freshTaskItem.id}' is already done and cannot be deleted.`);
  }

  const { newTree, newPath } = branch.deleteTaskItemSubtree(freshTree, freshTaskItem);

  memory.write.setTreeAndFocusPath(newTree, newPath);
}
