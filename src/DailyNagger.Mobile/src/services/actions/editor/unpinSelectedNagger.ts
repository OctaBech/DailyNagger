import type { Nagger } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { EditorRuntimeDependencies } from "./contracts";

export function naggerUnpinSelected(
  args: {
    readonly nagger: Nagger;
  },
  { memory, undoHistory }: EditorRuntimeDependencies,
): void {
  if (args.nagger.pinnedBy === "None") return;

  undoHistory.record(memory.read.getTreeAndSelectedPath());

  const { node, tree } = treeOperations;
  const { freshTree, freshNagger } = tree.readNagger(memory, args.nagger);
  const naggerV1 = node.setNaggerPinnedBy(freshNagger, "None");
  const result = tree.replaceNode(freshTree, naggerV1);

  memory.write.setTree(result.newTree);
}
