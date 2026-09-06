import type { Nagger } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { NavigationActionScope } from "./contracts";

export function naggerSetExpanded(
  { memory }: NavigationActionScope,
  nagger: Nagger,
  isExpanded: boolean,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshNagger } = tree.readNagger(memory, nagger);
  const naggerV1 = node.setNaggerExpanded(freshNagger, isExpanded);
  const result = tree.replaceNode(freshTree, naggerV1);

  memory.write.setTreeAndSelectedPath(result.newTree, result.newPath);
}
