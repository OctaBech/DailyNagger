import type { TaskItem } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { EditorRuntimeDependencies } from "./contracts";

export function addTaskItemToTaskItem(
  args: {
    readonly taskItem: TaskItem;
  },
  { memory }: EditorRuntimeDependencies,
): void {
  const { tree, branch, node } = treeOperations;

  const { freshTree, freshTaskItem } = tree.readTaskItem(memory, args.taskItem);

  const taskItemV1 = node.createTaskItem({
    taskLogId: freshTaskItem.taskLogId,
    parentTaskItemId: freshTaskItem.id,
  });

  const { newTree, newPath } = branch.addTaskItemToTaskItem(freshTree, freshTaskItem, taskItemV1);

  memory.write.setTreeAndFocusPath(newTree, newPath);
}

