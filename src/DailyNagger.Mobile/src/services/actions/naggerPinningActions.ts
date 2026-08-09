import { nodeReaderOperations } from "@/services/core-node-operations";
import { selectedPathOperations } from "@/services/core-tree-operations";
import { pinNaggerOperations } from "@/services/operations";
import type { Memory } from "../memory";
import type { Sending } from "../sending";

type NaggerPinningActionScope = {
  readonly memory: Memory;
  readonly sending: Sending;
};

export function naggerPinSelected({ memory, sending }: NaggerPinningActionScope): void {
  const selectedPath = memory.read.getSelectedPath();

  if (!nodeReaderOperations.canBePinned(selectedPath)) return;

  const nagger = selectedPathOperations.requireSelectedNagger(selectedPath);
  const tree = memory.read.getTree();
  const newTree = pinNaggerOperations.setNaggerPinnedBy("User", nagger, tree);
  const updatedNagger = selectedPathOperations.requireSelectedNagger(
    selectedPathOperations.refreshPathToNode(newTree, nagger),
  );

  memory.write.setTree(newTree);
  sending.queue(updatedNagger);
}

export function naggerUnpinSelected({ memory, sending }: NaggerPinningActionScope): void {
  const selectedPath = memory.read.getSelectedPath();

  if (!nodeReaderOperations.canBeUnpinned(selectedPath)) return;

  const nagger = selectedPathOperations.requireSelectedNagger(selectedPath);
  const tree = memory.read.getTree();
  const newTree = pinNaggerOperations.setNaggerPinnedBy("None", nagger, tree);
  const updatedNagger = selectedPathOperations.requireSelectedNagger(
    selectedPathOperations.refreshPathToNode(newTree, nagger),
  );

  memory.write.setTree(newTree);
  sending.queue(updatedNagger);
}
