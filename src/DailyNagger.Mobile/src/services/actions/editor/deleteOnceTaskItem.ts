import type { TaskItem } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { EditorRuntimeDependencies } from "./contracts";

export function editorDeleteOnceTaskItem(
  args: {
    readonly taskItem: TaskItem;
  },
  { memory }: EditorRuntimeDependencies,
): void {
  const { tree, branch } = treeOperations;
  const { freshTree, freshTaskItem } = tree.readTaskItem(memory, args.taskItem);

  if (freshTaskItem.rolloverBehavior !== "RemoveWhenDone") {
    throw new Error(`TaskItem '${freshTaskItem.id}' is not a once TaskItem.`);
  }

  if (freshTaskItem.isDone) {
    throw new Error(`TaskItem '${freshTaskItem.id}' is already done and cannot be deleted.`);
  }

  const { newTree, newPath } = branch.deleteTaskItemSubtree(freshTree, freshTaskItem);

  memory.write.setTreeAndFocusPath(newTree, newPath);
}

