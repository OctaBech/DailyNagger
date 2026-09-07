import type { TaskItem, TaskLog, TreeNode } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { TaskInputRuntimeDependencies } from "./contracts";

export function deleteOnceTaskItem(
  args: {
    readonly taskItem: TaskItem;
  },
  { memory, sending }: TaskInputRuntimeDependencies,
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

  const updatedTaskLog = newPath.find(isTaskLog);

  if (updatedTaskLog === undefined) {
    throw new Error(`TaskLog for deleted TaskItem '${freshTaskItem.id}' was not found.`);
  }

  sending.queue(updatedTaskLog);
}

function isTaskLog(node: TreeNode): node is TaskLog {
  return node.nodeType === "TaskLog";
}
