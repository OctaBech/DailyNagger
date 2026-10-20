import type { Nagger } from "@/models";
import { orderNaggersForPlanList } from "@/models";
import { formatDueDate, getCurrentAppDate, getTimeSection } from "@/app-day";

export type NagPlanListItem =
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
  nags: readonly Nagger[],
  today: string = getCurrentAppDate(),
): readonly NagPlanListItem[] {
  const sortedNaggers = orderNaggersForPlanList(nags);
  const items: NagPlanListItem[] = [];
  let previousDueOn: string | null | undefined = undefined;
  let previousSectionId: string | null = null;

  for (const nagger of sortedNaggers) {
    const isPinned = nagger.pinnedBy !== "None";

    if (!isPinned) {
      if (nagger.activeLogDueOn !== previousDueOn) {
        items.push({
          kind: "date-section",
          id: `date-section:${nagger.activeLogDueOn ?? "unscheduled"}`,
          title: formatDueDate(nagger.activeLogDueOn, "section", today),
        });
        previousDueOn = nagger.activeLogDueOn;
        previousSectionId = null;
      }

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
