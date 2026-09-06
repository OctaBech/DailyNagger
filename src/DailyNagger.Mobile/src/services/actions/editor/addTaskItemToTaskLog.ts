import type { TaskLog } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { EditorActionScope } from "./contracts";

export function addTaskItemToTaskLog({ memory }: EditorActionScope, staleTaskLog: TaskLog): void {
  const { tree, branch, node } = treeOperations;

  const { freshTree, freshTaskLog } = tree.readTaskLog(memory, staleTaskLog);

  const taskItemV1 = node.createTaskItem({
    taskLogId: freshTaskLog.id,
    parentTaskItemId: null,
  });

  const { newTree, newPath } = branch.addTaskItemToTaskLog(freshTree, freshTaskLog, taskItemV1);

  memory.write.setTreeAndFocusPath(newTree, newPath);
}
