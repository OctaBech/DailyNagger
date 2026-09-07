import type { TreePath } from "@/models";
import type { Guid } from "@/shared";
import { treeOperations } from "@/services/tree-operations";
import type { EditorSessionRuntimeDependencies } from "./contracts";

export function editorStartEdit(
  args: {
    readonly naggerId: Guid | null;
  },
  { editorMemory, planMemory }: EditorSessionRuntimeDependencies,
): void {
  const { node, tree } = treeOperations;

  const editorNagger =
    args.naggerId === null
      ? node.createNagger()
      : tree.readNagger(planMemory, args.naggerId).freshNagger;
  const editorTree = tree.createNagPlan([editorNagger]);
  const editorPath: TreePath =
    args.naggerId === null ? [editorNagger, editorTree] : planMemory.read.getSelectedPath();

  editorMemory.write.setTreeAndSelectedPath(editorTree, editorPath);
}
