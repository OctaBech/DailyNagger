import type { TaskItem } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { TaskInputRuntimeDependencies } from "./contracts";

export function taskItemSetDoneAndSetFocus(
  args: {
    readonly taskItem: TaskItem;
    readonly isDone: boolean;
  },
  { memory, sending, interactionStamp }: TaskInputRuntimeDependencies,
): void {
  const { tree, branch, node } = treeOperations;
  const { freshTree, freshTaskItem } = tree.readTaskItem(memory, args.taskItem);

  if (freshTaskItem.isDone === args.isDone) return;

  const taskItemV1 = node.setTaskItemDone(freshTaskItem, args.isDone);
  const updatedTaskItem = interactionStamp.applyTo(taskItemV1);

  const { newTree, newPath } = branch.replaceTaskItemAndUpdateDoneCounts(
    freshTree,
    updatedTaskItem,
  );

  memory.write.setTreeAndFocusPath(newTree, newPath);

  const { freshTaskLog } = tree.readTaskLog(memory, args.taskItem);
  sending.queue(freshTaskLog);
}
