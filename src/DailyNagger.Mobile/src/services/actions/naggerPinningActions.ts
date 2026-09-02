import type { Nagger } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { Memory } from "../memory";
import type { ActionSending } from "../sending";

type NaggerPinningActionScope = {
  readonly memory: Memory;
  readonly sending: ActionSending;
};

export function naggerPinSelected(
  { memory, sending }: NaggerPinningActionScope,
  nagger: Nagger,
): void {
  if (nagger.pinnedBy !== "None") return;

  const { node, tree } = treeOperations;
  const { freshTree, freshNagger } = tree.readNagger(memory, nagger);
  const naggerV1 = node.setNaggerPinnedBy(freshNagger, "User");
  const result = tree.replaceNode(freshTree, naggerV1);

  memory.write.setTree(result.newTree);
  sending.queue(naggerV1);
}

export function naggerUnpinSelected(
  { memory, sending }: NaggerPinningActionScope,
  nagger: Nagger,
): void {
  if (nagger.pinnedBy === "None") return;

  const { node, tree } = treeOperations;
  const { freshTree, freshNagger } = tree.readNagger(memory, nagger);
  const naggerV1 = node.setNaggerPinnedBy(freshNagger, "None");
  const result = tree.replaceNode(freshTree, naggerV1);

  memory.write.setTree(result.newTree);
  sending.queue(naggerV1);
}
