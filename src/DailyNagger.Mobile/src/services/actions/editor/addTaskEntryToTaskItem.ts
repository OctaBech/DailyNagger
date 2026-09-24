import type { TaskItem } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { EditorRuntimeDependencies } from "./contracts";

export function addTaskEntryToTaskItem(
  args: {
    readonly taskItem: TaskItem;
  },
  { memory }: EditorRuntimeDependencies,
): void {
  const { tree, branch, node } = treeOperations;

  const { freshTree, freshTaskItem } = tree.readTaskItem(memory, args.taskItem);

  const taskEntryV1 = node.createTaskEntry({
    taskLogId: freshTaskItem.taskLogId,
    parentTaskItemId: freshTaskItem.id,
  });

  const { newTree, newPath } = branch.addTaskEntryToTaskItem(freshTree, freshTaskItem, taskEntryV1);

  memory.write.setTreeAndFocusPath(newTree, newPath);
}
