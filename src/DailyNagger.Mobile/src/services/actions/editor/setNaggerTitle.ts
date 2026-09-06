import type { Nagger } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { EditorActionScope } from "./contracts";

export function editorNaggerSetTitle(
  { memory }: EditorActionScope,
  nagger: Nagger,
  title: string,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshNagger } = tree.readNagger(memory, nagger);
  const naggerV1 = node.setNaggerTitle(freshNagger, title);
  const result = tree.replaceNode(freshTree, naggerV1);

  memory.write.setTree(result.newTree);
}
