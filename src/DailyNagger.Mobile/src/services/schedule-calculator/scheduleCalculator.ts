import type { Nagger, ScheduleRule } from "@/models";
import type { CultureSettings } from "../culture";
import { operations } from "./operations";

export const scheduleCalculator = {
  getNextDueOn,
  getNextDueOnFromDate,
} as const;

function getNextDueOn(nagger: Nagger, cultureSettings: CultureSettings): string | null {
  if (nagger.isDeactivated) return null;

  return getNextDueOnFromDate(
    nagger.scheduleRules,
    cultureSettings.getTodayLocalIsoDate(),
    cultureSettings,
  );
}

function getNextDueOnFromDate(
  scheduleRules: readonly ScheduleRule[],
  fromLocalIsoDate: string,
  cultureSettings: CultureSettings,
): string | null {
  if (scheduleRules.length === 0) return null;

  const fromDate = cultureSettings.parseLocalIsoDate(fromLocalIsoDate);

  const nextDueOn = scheduleRules
    .map((rule) => getNextOccurrence(rule, fromDate, cultureSettings))
    .filter((dueOn) => dueOn !== null)
    .sort()[0];

  if (nextDueOn === undefined) return null;

  return nextDueOn;
}

function getNextOccurrence(
  rule: ScheduleRule,
  fromDate: Date,
  cultureSettings: CultureSettings,
): string | null {
  switch (rule.ruleType) {
    case "Weekday":
      return operations.getNextWeekdayOccurrence(rule.rule, fromDate, cultureSettings);
    case "Date":
      return operations.getNextDateOccurrence(rule.rule, fromDate, cultureSettings);
    case "Holiday":
      return operations.getNextHolidayOccurrence(rule.rule, fromDate, cultureSettings);
  }
}
