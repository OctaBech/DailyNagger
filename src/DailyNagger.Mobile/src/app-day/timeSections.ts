import { appTiming } from "@/config/appTiming";
import { getAppDayStartMinute, parseTargetMinute } from "./appDay";

export type TimeSection = {
  readonly id: string;
  readonly title: string;
  readonly rangeLabel: string;
  readonly startMinute: number;
  readonly endMinute: number;
};

export const timeSections: readonly TimeSection[] = [
  {
    id: "morning",
    title: "Morning",
    rangeLabel: `${appTiming.rollover.dayBoundaryTime}-11:59`,
    startMinute: getAppDayStartMinute(),
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
    rangeLabel: `21:00-${formatMinute((getAppDayStartMinute() + 1439) % 1440)}`,
    startMinute: 21 * 60,
    endMinute: (getAppDayStartMinute() + 1439) % 1440,
  },
  {
    id: "any-time",
    title: "Any time",
    rangeLabel: "No target time",
    startMinute: Number.POSITIVE_INFINITY,
    endMinute: Number.POSITIVE_INFINITY,
  },
];

export function getTimeSection(targetTime: string | null): TimeSection {
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

function formatMinute(minute: number): string {
  return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}
