import type { TreePath } from "@/models";
import type { Guid } from "@/shared";
import { NodeTemplates } from "@/services/core-node-templates";
import { selectedPathOperations } from "@/services/core-tree-operations";
import { editorSessionOperations, orderNaggersByDate } from "@/services/operations";
import type { Memory } from "../memory";
import type { Sending } from "../sending";

export type EditorSessionActionScope = {
  readonly editorMemory: Memory;
  readonly planMemory: Memory;
  readonly sending: Sending;
};

export function editorStartEdit(
  { editorMemory, planMemory }: EditorSessionActionScope,
  naggerId: Guid | null,
): void {
  if (naggerId === null) {
    const newNagger = NodeTemplates.getNagger();
    const tempTree = NodeTemplates.getNagPlan([newNagger]);
    const tempTreePath: TreePath = [newNagger, tempTree];

    editorMemory.write.setTreeAndSelectedPath(tempTree, tempTreePath);
    return;
  }

  const planTree = planMemory.read.getTree();
  const selectedPath = planMemory.read.getSelectedPath();
  const { pruneTreeToSingleNagger } = editorSessionOperations;

  const editTree = pruneTreeToSingleNagger(naggerId, planTree);
  editorMemory.write.setTreeAndSelectedPath(editTree, selectedPath);
}

export function editorSaveEdit({
  editorMemory,
  planMemory,
  sending,
}: EditorSessionActionScope): void {
  const planTree = planMemory.read.getTree();
  const editorSelectedPath = editorMemory.read.getSelectedPath();

  const { nagger: editorNagger, taskLog: editorTaskLog } =
    selectedPathOperations.deriveSelectedNodes(editorSelectedPath);

  if (editorNagger === null || editorTaskLog === null) {
    throw new Error("Cannot save editor TaskLog because editor tree contains no nagger.");
  }

  const { getRootVersioning, insertNaggerIntoTree, insertRootVersioning, getRefreshedPath } =
    editorSessionOperations;

  const { versionedNagger, versionedTaskLog } = getRootVersioning(planTree, editorNagger);
  const newPlanTree = insertNaggerIntoTree(editorNagger, planTree);
  const newPlanTreeWithVersioning = insertRootVersioning(
    newPlanTree,
    versionedNagger,
    versionedTaskLog,
  );

  const newPlanTreeWithVersioningSorted = orderNaggersByDate(newPlanTreeWithVersioning);
  const editorPathConvertedToPlanPath = getRefreshedPath(
    newPlanTreeWithVersioningSorted,
    editorSelectedPath,
  );
  const { nagger: updatedNagger, taskLog: updatedTaskLog } =
    selectedPathOperations.deriveSelectedNodes(editorPathConvertedToPlanPath);

  if (updatedNagger === null || updatedTaskLog === null) {
    throw new Error("Cannot save editor TaskLog because the saved path has no roots.");
  }

  planMemory.write.setTreeAndSelectedPath(
    newPlanTreeWithVersioningSorted,
    editorPathConvertedToPlanPath,
  );

  editorMemory.write.clear();

  sending.queue(updatedNagger);
  sending.queue(updatedTaskLog);
}
