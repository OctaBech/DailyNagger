import type { Nagger } from "@/models/clientModel";
import { orderNaggersForPlanList } from "@/models/naggerOrdering";
import type { Holiday } from "@/holidays";

export type NagPlanEntry =
  | { readonly kind: "nagger"; readonly nagger: Nagger }
  | { readonly kind: "holiday"; readonly holiday: Holiday };

export function zipNaggersAndHolidays(
  naggers: readonly Nagger[],
  holidays: readonly Holiday[],
): readonly NagPlanEntry[] {
  const entries: NagPlanEntry[] = [];
  const sortedHolidays = [...holidays].sort((left, right) => left.date.localeCompare(right.date));
  let holidayIndex = 0;

  for (const nagger of orderNaggersForPlanList(naggers)) {
    if (nagger.pinnedBy === "None") {
      while (
        holidayIndex < sortedHolidays.length &&
        (nagger.activeLogDueOn === null ||
          sortedHolidays[holidayIndex].date <= nagger.activeLogDueOn)
      ) {
        entries.push({ kind: "holiday", holiday: sortedHolidays[holidayIndex++] });
      }
    }
    entries.push({ kind: "nagger", nagger });
  }

  while (holidayIndex < sortedHolidays.length) {
    entries.push({ kind: "holiday", holiday: sortedHolidays[holidayIndex++] });
  }
  return entries;
}
