import type { NaggerPinnedBy } from "@/api/dto";
import type { Nagger, Tree } from "@/models";
import { treeMutationOperations } from "@/services/core-tree-operations";

export const pinNaggerOperations = { setNaggerPinnedBy };

function setNaggerPinnedBy(pinBy: NaggerPinnedBy, nagger: Nagger, tree: Tree): Tree {
  const { tree: newTree } = treeMutationOperations.replaceNagger(tree, nagger, (nagger) => {
    return { ...nagger, pinnedBy: pinBy };
  });

  return newTree;
}
