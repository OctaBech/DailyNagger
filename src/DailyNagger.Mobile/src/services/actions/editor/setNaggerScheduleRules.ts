import type { Nagger, ScheduleRule } from "@/models";
import { scheduleCalculator } from "@/services/schedule-calculator";
import { treeOperations } from "@/services/tree-operations";
import type { EditorActionScope } from "./contracts";

export function editorNaggerSetScheduleRules(
  { cultureSettings, memory }: EditorActionScope,
  nagger: Nagger,
  scheduleRules: readonly ScheduleRule[],
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshNagger } = tree.readNagger(memory, nagger);
  const activeLogDueOn = scheduleCalculator.getNextDueOn(
    { ...freshNagger, scheduleRules },
    cultureSettings,
  );
  const naggerV1 = node.setNaggerScheduleRules(freshNagger, scheduleRules, activeLogDueOn);
  const result = tree.replaceNode(freshTree, naggerV1);

  memory.write.setTreeAndSelectedPath(result.newTree, result.newPath);
}
