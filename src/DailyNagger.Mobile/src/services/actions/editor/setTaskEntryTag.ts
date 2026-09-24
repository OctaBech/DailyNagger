import type { TaskEntry } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { EditorRuntimeDependencies } from "./contracts";

export function editorTaskEntrySetTag(
  args: {
    readonly taskEntry: TaskEntry;
    readonly tag: string | null;
  },
  { memory }: EditorRuntimeDependencies,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshTaskEntry } = tree.readTaskEntry(memory, args.taskEntry);
  const taskEntryV1 = node.setTaskEntryTag(freshTaskEntry, args.tag);
  const result = tree.replaceNode(freshTree, taskEntryV1);

  memory.write.setTreeAndSelectedPath(result.newTree, result.newPath);
}
