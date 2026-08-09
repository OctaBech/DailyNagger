import type { Nagger } from "@/models";
import { orderNaggersForPlanList } from "@/services/operations";

export type NagPlanListItem =
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

type TimeSection = {
  readonly id: string;
  readonly title: string;
  readonly rangeLabel: string;
  readonly startMinute: number;
  readonly endMinute: number;
};

const timeSections: readonly TimeSection[] = [
  {
    id: "morning",
    title: "Morning",
    rangeLabel: "05:00-11:59",
    startMinute: 5 * 60,
    endMinute: 11 * 60 + 59,
  },
  {
    id: "afternoon",
    title: "Afternoon",
    rangeLabel: "12:00-16:59",
    startMinute: 12 * 60,
    endMinute: 16 * 60 + 59,
  },
  {
    id: "evening",
    title: "Evening",
    rangeLabel: "17:00-20:59",
    startMinute: 17 * 60,
    endMinute: 20 * 60 + 59,
  },
  {
    id: "night",
    title: "Night",
    rangeLabel: "21:00-04:59",
    startMinute: 21 * 60,
    endMinute: 4 * 60 + 59,
  },
  {
    id: "any-time",
    title: "Any time",
    rangeLabel: "No target time",
    startMinute: Number.POSITIVE_INFINITY,
    endMinute: Number.POSITIVE_INFINITY,
  },
];

export function buildNagPlanListItems(nags: readonly Nagger[]): readonly NagPlanListItem[] {
  const sortedNaggers = orderNaggersForPlanList(nags);
  const items: NagPlanListItem[] = [];
  let previousSectionId: string | null = null;

  for (const nagger of sortedNaggers) {
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

    items.push({
      kind: "nagger",
      id: `nagger:${nagger.id}`,
      nagger,
    });
  }

  return items;
}

function getTimeSection(targetTime: string | null): TimeSection {
  const targetMinute = parseTargetMinute(targetTime);

  if (targetMinute === null) return timeSections[4];

  return (
    timeSections.find((section) => {
      if (section.id === "any-time") return false;
      if (section.startMinute <= section.endMinute) {
        return targetMinute >= section.startMinute && targetMinute <= section.endMinute;
      }

      return targetMinute >= section.startMinute || targetMinute <= section.endMinute;
    }) ?? timeSections[4]
  );
}

function parseTargetMinute(targetTime: string | null): number | null {
  if (targetTime === null) return null;

  const [hoursText, minutesText] = targetTime.split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;

  return hours * 60 + minutes;
}
