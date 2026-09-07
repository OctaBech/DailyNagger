import type { Nagger } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { EditorActionScope } from "./contracts";

export function naggerPinSelected(
  args: {
    readonly nagger: Nagger;
  },
  { memory }: EditorActionScope,
): void {
  if (args.nagger.pinnedBy !== "None") return;

  const { node, tree } = treeOperations;
  const { freshTree, freshNagger } = tree.readNagger(memory, args.nagger);
  const naggerV1 = node.setNaggerPinnedBy(freshNagger, "User");
  const result = tree.replaceNode(freshTree, naggerV1);

  memory.write.setTree(result.newTree);
}
