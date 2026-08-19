import type { TaskItem, TaskLog, TreeNode } from "@/models";
import type { Memory } from "@/services/contracts";
import { treeOperations } from "@/services/tree-operations";
import type { Sending } from "../sending";

type DeleteTreeNodeActionScope = {
  readonly memory: Memory;
  readonly sending: Sending;
};

export function deleteOnceTaskItem(
  { memory, sending }: DeleteTreeNodeActionScope,
  staleTaskItem: TaskItem,
): void {
  const { tree, branch } = treeOperations;

  const { freshTree, freshTaskItem } = tree.readTaskItem(memory, staleTaskItem);

  if (freshTaskItem.rolloverBehavior !== "RemoveWhenDone") {
    throw new Error(`TaskItem '${freshTaskItem.id}' is not a once TaskItem.`);
  }

  if (freshTaskItem.taskEntries.length > 0 || freshTaskItem.taskItems.length > 0) {
    throw new Error(`TaskItem '${freshTaskItem.id}' cannot be deleted as a once leaf.`);
  }

  const { newTree, newPath } = branch.deleteTaskItemLeaf(freshTree, freshTaskItem);

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
