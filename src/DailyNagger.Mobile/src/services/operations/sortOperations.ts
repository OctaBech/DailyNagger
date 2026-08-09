import type { Nagger, Tree } from "@/models";

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

export function getTargetMinuteSortValue(targetTime: string | null): number {
  return parseTargetMinute(targetTime) ?? Number.POSITIVE_INFINITY;
}

function parseTargetMinute(targetTime: string | null): number | null {
  if (targetTime === null) return null;

  const [hoursText, minutesText] = targetTime.split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;

  return hours * 60 + minutes;
}
