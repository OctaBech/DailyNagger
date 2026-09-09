import type { TaskLog } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { NavigationRuntimeDependencies } from "./contracts";

export function taskLogSetFocused(
  args: {
    readonly taskLog: TaskLog;
  },
  { memory }: NavigationRuntimeDependencies,
): void {
  const { tree } = treeOperations;
  const { freshTree, freshTaskLog } = tree.readTaskLog(memory, args.taskLog);
  const result = tree.replaceNode(freshTree, freshTaskLog);

  memory.write.setTreeAndSelectedPath(result.newTree, result.newPath);
}


