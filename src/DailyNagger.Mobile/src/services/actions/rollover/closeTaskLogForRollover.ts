import type { Nagger } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { RolloverActionScope } from "./contracts";

export function closeTaskLogForRollover(
  { planMemory, sending }: RolloverActionScope,
  nagger: Nagger,
): void {
  const { node, tree } = treeOperations;
  const { freshNagger, freshTree } = tree.readNagger(planMemory, nagger);
  const freshTaskLog = freshNagger.taskLog;

  if (node.isTaskLogClosed(freshTaskLog)) return;

  const closedTaskLog = node.closeTaskLogForNaggerHistory(freshTaskLog, freshNagger);
  const naggerV1 = node.attachTaskLog(freshNagger, closedTaskLog, freshNagger.activeLogDueOn);
  const treeV1 = tree.replaceNagger(freshTree, naggerV1);

  planMemory.write.setTree(treeV1);
  sending.queue(closedTaskLog);
}

