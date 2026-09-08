import type { Nagger, ScheduleRule } from "@/models";
import { scheduleCalculator } from "@/services/schedule-calculator";
import { treeOperations } from "@/services/tree-operations";
import type { EditorRuntimeDependencies } from "./contracts";

export function editorNaggerSetScheduleRules(
  args: {
    readonly nagger: Nagger;
    readonly scheduleRules: readonly ScheduleRule[];
  },
  { cultureSettings, memory }: EditorRuntimeDependencies,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshNagger } = tree.readNagger(memory, args.nagger);
  const activeLogDueOn = scheduleCalculator.getNextDueOn(
    { ...freshNagger, scheduleRules: args.scheduleRules },
    cultureSettings,
  );
  const naggerV1 = node.setNaggerScheduleRules(freshNagger, args.scheduleRules, activeLogDueOn);
  const result = tree.replaceNode(freshTree, naggerV1);

  memory.write.setTreeAndSelectedPath(result.newTree, result.newPath);
}
