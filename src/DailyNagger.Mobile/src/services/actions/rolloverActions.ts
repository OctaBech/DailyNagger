import type { Nagger } from "@/models";
import type { CultureSettings } from "@/services/culture";
import type { Memory } from "@/services/memory";
import { scheduleCalculator } from "@/services/schedule-calculator";
import type { Sending } from "@/services/sending";
import { treeOperations } from "../tree-operations";

type RolloverActionScope = {
  readonly cultureSettings: CultureSettings;
  readonly planMemory: Memory;
  readonly sending: Sending;
};

export function rolloverNagger(
  { cultureSettings, planMemory, sending }: RolloverActionScope,
  nagger: Nagger,
): void {
  const { node, tree } = treeOperations;
  const { freshNagger, freshTree } = tree.readNagger(planMemory, nagger);
  const freshTaskLog = freshNagger.taskLog;

  if (node.isTaskLogClosed(freshTaskLog) === false) {
    throw new Error(
      `Cannot rollover Nagger '${freshNagger.id}' because TaskLog '${freshTaskLog.id}' is still open.`,
    );
  }

  const taskLogV1 = node.createRolledOverTaskLog(freshTaskLog);
  const activeLogDueOnV1 = scheduleCalculator.getNextDueOn(freshNagger, cultureSettings);
  const naggerV1 = node.attachTaskLog(freshNagger, taskLogV1, activeLogDueOnV1);

  const treeV1 = tree.replaceNagger(freshTree, naggerV1);

  planMemory.write.setTree(treeV1);

  sending.queue(naggerV1);
  sending.queue(taskLogV1);
}

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
