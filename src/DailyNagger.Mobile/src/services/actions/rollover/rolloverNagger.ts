import type { Nagger } from "@/models";
import { scheduleCalculator } from "@/services/schedule-calculator";
import { treeOperations } from "@/services/tree-operations";
import type { RolloverActionScope } from "./contracts";

export function rolloverNagger(
  { cultureSettings, planMemory, sending }: RolloverActionScope,
  nagger: Nagger,
): void {
  const { node, rollover, tree } = treeOperations;
  const { freshNagger, freshTree } = tree.readNagger(planMemory, nagger);
  const freshTaskLog = freshNagger.taskLog;

  if (node.isTaskLogClosed(freshTaskLog) === false) {
    throw new Error(
      `Cannot rollover Nagger '${freshNagger.id}' because TaskLog '${freshTaskLog.id}' is still open.`,
    );
  }

  const taskLogV1 = rollover.createTaskLog(freshTaskLog);
  const activeLogDueOnV1 = scheduleCalculator.getNextDueOn(freshNagger, cultureSettings);
  const naggerV1 = node.attachTaskLog(freshNagger, taskLogV1, activeLogDueOnV1);

  const treeV1 = tree.replaceNagger(freshTree, naggerV1);

  planMemory.write.setTree(treeV1);

  sending.queue(naggerV1);
  sending.queue(taskLogV1);
}
