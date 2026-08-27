import type { Nagger } from "@/models";
import { selectedPathOperations } from "@/services/core-tree-operations";
import { pinNaggerOperations } from "@/services/operations";
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

  const tree = memory.read.getTree();
  const newTree = pinNaggerOperations.setNaggerPinnedBy("User", nagger, tree);
  const updatedNagger = selectedPathOperations.requireSelectedNagger(
    selectedPathOperations.refreshPathToNode(newTree, nagger),
  );

  memory.write.setTree(newTree);
  sending.queue(updatedNagger);
}

export function naggerUnpinSelected(
  { memory, sending }: NaggerPinningActionScope,
  nagger: Nagger,
): void {
  if (nagger.pinnedBy === "None") return;

  const tree = memory.read.getTree();
  const newTree = pinNaggerOperations.setNaggerPinnedBy("None", nagger, tree);
  const updatedNagger = selectedPathOperations.requireSelectedNagger(
    selectedPathOperations.refreshPathToNode(newTree, nagger),
  );

  memory.write.setTree(newTree);
  sending.queue(updatedNagger);
}
