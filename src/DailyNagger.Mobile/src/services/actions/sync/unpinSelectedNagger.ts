import type { Nagger } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { SyncActionScope } from "./contracts";

export function naggerUnpinSelected({ memory, sending }: SyncActionScope, nagger: Nagger): void {
  if (nagger.pinnedBy === "None") return;

  const { node, tree } = treeOperations;
  const { freshTree, freshNagger } = tree.readNagger(memory, nagger);
  const naggerV1 = node.setNaggerPinnedBy(freshNagger, "None");
  const result = tree.replaceNode(freshTree, naggerV1);

  memory.write.setTree(result.newTree);
  sending.queue(naggerV1);
}
