import type { Nagger, TreePath } from "@/models";
import { orderNaggersByDate } from "@/models";
import type { Guid } from "@/shared";
import { treeOperations } from "@/services/tree-operations";
import type { Memory } from "../memory";
import type { ActionSending } from "../sending";

export type EditorSessionActionScope = {
  readonly editorMemory: Memory;
  readonly planMemory: Memory;
  readonly sending: ActionSending;
};

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

export function editorSaveEdit(
  { editorMemory, planMemory, sending }: EditorSessionActionScope,
  nagger: Nagger,
): void {
  const planTree = planMemory.read.getTree();
  const editorSelectedPath = editorMemory.read.getSelectedPath();
  const { node, tree } = treeOperations;
  const { freshNagger: editorNagger, freshTaskLog: editorTaskLog } = treeOperations.tree.readNagger(
    editorMemory,
    nagger,
  );

  const planRoot = tree.tryReadNagger(planMemory, editorNagger);
  const isNewNagger = planRoot === null;
  const naggerV1 = node.copyNaggerVersionFrom(editorNagger, planRoot?.freshNagger ?? null);
  const taskLogV1 = node.copyTaskLogVersionFrom(editorTaskLog, planRoot?.freshTaskLog ?? null);
  const naggerV2 = node.attachTaskLog(naggerV1, taskLogV1, naggerV1.activeLogDueOn);

  const newPlanTree = isNewNagger
    ? treeOperations.branch.addNaggerToNagPlan(planTree, naggerV2).newTree
    : tree.replaceNagger(planTree, naggerV2);

  const newPlanTreeWithVersioningSorted = orderNaggersByDate(newPlanTree);

  planMemory.write.setTreeAndSelectedPath(newPlanTreeWithVersioningSorted, editorSelectedPath);

  editorMemory.write.clear();

  sending.queue(naggerV2);
  sending.queue(taskLogV1);
}

export function editorCancelEdit({ editorMemory }: EditorSessionActionScope): void {
  editorMemory.write.clear();
}
