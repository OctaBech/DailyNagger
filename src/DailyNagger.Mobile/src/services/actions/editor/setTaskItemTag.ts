import type { TaskItem } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { EditorRuntimeDependencies } from "./contracts";

export function editorTaskItemSetTag(
  args: {
    readonly taskItem: TaskItem;
    readonly tag: string | null;
  },
  { memory }: EditorRuntimeDependencies,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshTaskItem } = tree.readTaskItem(memory, args.taskItem);
  const taskItemV1 = node.setTaskItemTag(freshTaskItem, args.tag);
  const result = tree.replaceNode(freshTree, taskItemV1);

  memory.write.setTreeAndSelectedPath(result.newTree, result.newPath);
}

