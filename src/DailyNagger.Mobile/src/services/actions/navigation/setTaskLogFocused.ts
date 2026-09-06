import type { TaskLog } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { NavigationActionScope } from "./contracts";

export function taskLogSetFocused({ memory }: NavigationActionScope, taskLog: TaskLog): void {
  const { tree } = treeOperations;
  const { freshTree, freshTaskLog } = tree.readTaskLog(memory, taskLog);
  const result = tree.replaceNode(freshTree, freshTaskLog);

  memory.write.setTreeAndSelectedPath(result.newTree, result.newPath);
}
