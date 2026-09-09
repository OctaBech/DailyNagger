import type { TaskLog } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { EditorRuntimeDependencies } from "./contracts";

export function editorTaskLogSetTag(
  args: {
    readonly taskLog: TaskLog;
    readonly tag: string | null;
  },
  { memory }: EditorRuntimeDependencies,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshTaskLog } = tree.readTaskLog(memory, args.taskLog);
  const taskLogV1 = node.setTaskLogTag(freshTaskLog, args.tag);
  const result = tree.replaceNode(freshTree, taskLogV1);

  memory.write.setTreeAndSelectedPath(result.newTree, result.newPath);
}

