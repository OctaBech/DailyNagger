import type { Nagger } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { NavigationRuntimeDependencies } from "./contracts";

export function naggerSetExpanded(
  args: {
    readonly nagger: Nagger;
    readonly isExpanded: boolean;
  },
  { memory }: NavigationRuntimeDependencies,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshNagger } = tree.readNagger(memory, args.nagger);
  const naggerV1 = node.setNaggerExpanded(freshNagger, args.isExpanded);
  const result = tree.replaceNode(freshTree, naggerV1);

  memory.write.setTreeAndSelectedPath(result.newTree, result.newPath);
}

