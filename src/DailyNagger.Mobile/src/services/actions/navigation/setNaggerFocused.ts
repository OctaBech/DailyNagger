import type { Nagger } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { NavigationActionScope } from "./contracts";

export function naggerSetFocused({ memory }: NavigationActionScope, nagger: Nagger): void {
  const { tree } = treeOperations;
  const { freshTree, freshNagger } = tree.readNagger(memory, nagger);
  const result = tree.replaceNode(freshTree, freshNagger);

  memory.write.setTreeAndSelectedPath(result.newTree, result.newPath);
}
