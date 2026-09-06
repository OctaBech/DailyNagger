import type { TaskLog } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { EditorActionScope } from "./contracts";

export function editorTaskLogSetTag(
  { memory }: EditorActionScope,
  taskLog: TaskLog,
  tag: string | null,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshTaskLog } = tree.readTaskLog(memory, taskLog);
  const taskLogV1 = node.setTaskLogTag(freshTaskLog, tag);
  const result = tree.replaceNode(freshTree, taskLogV1);

  memory.write.setTreeAndSelectedPath(result.newTree, result.newPath);
}
