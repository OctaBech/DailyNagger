import type { Nagger } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { NavigationRuntimeDependencies } from "./contracts";

export function naggerSetFocused(
  args: {
    readonly nagger: Nagger;
  },
  { memory }: NavigationRuntimeDependencies,
): void {
  const { tree } = treeOperations;
  const { freshTree, freshNagger } = tree.readNagger(memory, args.nagger);
  const result = tree.replaceNode(freshTree, freshNagger);

  memory.write.setTreeAndSelectedPath(result.newTree, result.newPath);
}
