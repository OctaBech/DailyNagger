import type { Nagger } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { EditorRuntimeDependencies } from "./contracts";

export function editorNaggerSetTargetTime(
  args: {
    readonly nagger: Nagger;
    readonly targetTime: string | null;
  },
  { memory }: EditorRuntimeDependencies,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshNagger } = tree.readNagger(memory, args.nagger);
  const naggerV1 = node.setNaggerTargetTime(freshNagger, args.targetTime);
  const result = tree.replaceNode(freshTree, naggerV1);

  memory.write.setTreeAndSelectedPath(result.newTree, result.newPath);
}

