import type { Nagger } from "./clientModel";
import type { Tree } from "./nodeTypes";
import { getTargetMinuteSortValue } from "@/app-day";

export function orderNaggersByDate(tree: Tree): Tree {
  return {
    ...tree,
    nags: orderNaggersForPlanList(tree.nags),
  };
}

export function orderNaggersForPlanList(naggers: readonly Nagger[]): readonly Nagger[] {
  return [...naggers].sort(compareNaggersForPlanList);
}

function compareNaggersForPlanList(nagA: Nagger, nagB: Nagger): number {
  if (nagA.pinnedBy !== "None" && nagB.pinnedBy === "None") return -1;
  if (nagA.pinnedBy === "None" && nagB.pinnedBy !== "None") return 1;

  const dueA = nagA.activeLogDueOn ?? "9999-12-31";
  const dueB = nagB.activeLogDueOn ?? "9999-12-31";

  if (dueA !== dueB) return dueA < dueB ? -1 : 1;

  const nagATargetTime = getTargetMinuteSortValue(nagA.targetTime);
  const nagBTargetTime = getTargetMinuteSortValue(nagB.targetTime);

  if (nagATargetTime !== nagBTargetTime) return nagATargetTime < nagBTargetTime ? -1 : 1;

  if (nagA.title !== nagB.title) return nagA.title < nagB.title ? -1 : 1;

  return nagA.id < nagB.id ? -1 : 1;
}
