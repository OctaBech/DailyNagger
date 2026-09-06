import type { TreePath } from "@/models";
import type { Guid } from "@/shared";
import { treeOperations } from "@/services/tree-operations";
import type { EditorSessionActionScope } from "./contracts";

export function editorStartEdit(
  { editorMemory, planMemory }: EditorSessionActionScope,
  naggerId: Guid | null,
): void {
  const { node, tree } = treeOperations;

  const editorNagger =
    naggerId === null ? node.createNagger() : tree.readNagger(planMemory, naggerId).freshNagger;
  const editorTree = tree.createNagPlan([editorNagger]);
  const editorPath: TreePath =
    naggerId === null ? [editorNagger, editorTree] : planMemory.read.getSelectedPath();

  editorMemory.write.setTreeAndSelectedPath(editorTree, editorPath);
}
