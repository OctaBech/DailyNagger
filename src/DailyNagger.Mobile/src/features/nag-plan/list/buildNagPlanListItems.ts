import type { Nagger } from "@/models";
import type { Holiday } from "@/holidays";
import type { NagPlanEntry } from "./zipNaggersAndHolidays";
import { formatDueDate, getCurrentAppDate, getTimeSection } from "@/app-day";

export type NagPlanListItem =
  | { readonly kind: "holiday"; readonly id: string; readonly holiday: Holiday }
  | {
      readonly kind: "date-section";
      readonly id: string;
      readonly title: string;
    }
  | {
      readonly kind: "time-section";
      readonly id: string;
      readonly title: string;
      readonly rangeLabel: string;
    }
  | {
      readonly kind: "nagger";
      readonly id: string;
      readonly nagger: Nagger;
    };

export function buildNagPlanListItems(
  entries: readonly NagPlanEntry[],
  today: string = getCurrentAppDate(),
): readonly NagPlanListItem[] {
  const items: NagPlanListItem[] = [];
  let previousDueOn: string | null | undefined = undefined;
  let previousSectionId: string | null = null;

  for (const entry of entries) {
    const isPinned = entry.kind === "nagger" && entry.nagger.pinnedBy !== "None";
    const dueOn = entry.kind === "holiday" ? entry.holiday.date : entry.nagger.activeLogDueOn;

    if (!isPinned && dueOn !== previousDueOn) {
      items.push({
        kind: "date-section",
        id: `date-section:${dueOn ?? "unscheduled"}`,
        title: formatDueDate(dueOn, "section", today),
      });
      previousDueOn = dueOn;
      previousSectionId = null;
    }

    if (entry.kind === "holiday") {
      items.push({
        kind: "holiday",
        id: `holiday:${entry.holiday.date}:${entry.holiday.name}`,
        holiday: entry.holiday,
      });
      continue;
    }

    const { nagger } = entry;
    if (!isPinned) {
      if (nagger.activeLogDueOn !== null) {
        const section = getTimeSection(nagger.targetTime);

        if (section.id !== previousSectionId) {
          items.push({
            kind: "time-section",
            id: `time-section:${section.id}:${items.length}`,
            title: section.title,
            rangeLabel: section.rangeLabel,
          });
          previousSectionId = section.id;
        }
      }
    }

    items.push({
      kind: "nagger",
      id: `nagger:${nagger.id}`,
      nagger,
    });
  }

  return items;
}
