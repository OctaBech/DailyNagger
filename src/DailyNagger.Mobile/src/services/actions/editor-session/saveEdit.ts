import type { Nagger } from "@/models";
import { orderNaggersByDate } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { EditorSessionRuntimeDependencies } from "./contracts";

export function editorSaveEdit(
  args: {
    readonly nagger: Nagger;
  },
  { editorMemory, planMemory, sending }: EditorSessionRuntimeDependencies,
): void {
  const planTree = planMemory.read.getTree();
  const editorSelectedPath = editorMemory.read.getSelectedPath();
  const { node, tree } = treeOperations;
  const { freshNagger: editorNagger, freshTaskLog: editorTaskLog } = treeOperations.tree.readNagger(
    editorMemory,
    args.nagger,
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
