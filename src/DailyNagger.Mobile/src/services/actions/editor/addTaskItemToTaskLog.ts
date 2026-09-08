import type { TaskLog } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { EditorRuntimeDependencies } from "./contracts";

export function addTaskItemToTaskLog(
  args: {
    readonly taskLog: TaskLog;
  },
  { memory }: EditorRuntimeDependencies,
): void {
  const { tree, branch, node } = treeOperations;

  const { freshTree, freshTaskLog } = tree.readTaskLog(memory, args.taskLog);

  const taskItemV1 = node.createTaskItem({
    taskLogId: freshTaskLog.id,
    parentTaskItemId: null,
  });

  const { newTree, newPath } = branch.addTaskItemToTaskLog(freshTree, freshTaskLog, taskItemV1);

  memory.write.setTreeAndFocusPath(newTree, newPath);
}
