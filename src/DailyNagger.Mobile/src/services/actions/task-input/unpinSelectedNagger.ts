import type { Nagger } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { TaskInputActionScope } from "./contracts";

export function naggerUnpinSelected(
  args: {
    readonly nagger: Nagger;
  },
  { memory, sending }: TaskInputActionScope,
): void {
  if (args.nagger.pinnedBy === "None") return;

  const { node, tree } = treeOperations;
  const { freshTree, freshNagger } = tree.readNagger(memory, args.nagger);
  const naggerV1 = node.setNaggerPinnedBy(freshNagger, "None");
  const result = tree.replaceNode(freshTree, naggerV1);

  memory.write.setTree(result.newTree);
  sending.queue(naggerV1);
}
