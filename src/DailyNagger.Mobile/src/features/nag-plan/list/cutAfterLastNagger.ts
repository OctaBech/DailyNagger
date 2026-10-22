import type { NagPlanEntry } from "./zipNaggersAndHolidays";

export function cutAfterLastNagger(entries: readonly NagPlanEntry[]): readonly NagPlanEntry[] {
  for (let index = entries.length - 1; index >= 0; index--) {
    if (entries[index].kind === "nagger") return entries.slice(0, index + 1);
  }
  return [];
}
