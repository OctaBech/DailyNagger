import type { TaskEntry } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { EditorRuntimeDependencies } from "./contracts";

export function editorTaskEntrySetLabel(
  args: {
    readonly taskEntry: TaskEntry;
    readonly label: string;
  },
  { memory }: EditorRuntimeDependencies,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshTaskEntry } = tree.readTaskEntry(memory, args.taskEntry);
  const taskEntryV1 = node.setTaskEntryLabel(freshTaskEntry, args.label);
  const result = tree.replaceNode(freshTree, taskEntryV1);

  memory.write.setTree(result.newTree);
}

