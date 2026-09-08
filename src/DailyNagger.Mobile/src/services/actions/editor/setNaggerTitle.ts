import type { Nagger } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { EditorRuntimeDependencies } from "./contracts";

export function editorNaggerSetTitle(
  args: {
    readonly nagger: Nagger;
    readonly title: string;
  },
  { memory }: EditorRuntimeDependencies,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshNagger } = tree.readNagger(memory, args.nagger);
  const naggerV1 = node.setNaggerTitle(freshNagger, args.title);
  const result = tree.replaceNode(freshTree, naggerV1);

  memory.write.setTree(result.newTree);
}
