import type { Nagger, ScheduleRule } from "@/models";
import { assertNever } from "@/shared";
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
    nagger.expiresOn,
  );
}

function getNextDueOnFromDate(
  scheduleRules: readonly ScheduleRule[],
  fromLocalIsoDate: string,
  cultureSettings: CultureSettings,
  expiresOn: string | null = null,
): string | null {
  if (scheduleRules.length === 0) return null;
  if (expiresOn !== null && fromLocalIsoDate > expiresOn) return null;

  const fromDate = cultureSettings.parseLocalIsoDate(fromLocalIsoDate);

  const nextDueOn = scheduleRules
    .map((rule) => getNextOccurrence(rule, fromDate, cultureSettings))
    .filter((dueOn) => dueOn !== null)
    .sort()[0];

  if (nextDueOn === undefined) return null;
  if (expiresOn !== null && nextDueOn > expiresOn) return null;

  return nextDueOn;
}

function getNextOccurrence(
  rule: ScheduleRule,
  fromDate: Date,
  cultureSettings: CultureSettings,
): string | null {
  switch (rule.ruleType) {
    case "Monday":
      return operations.getNextWeeklyOccurrence(1, fromDate, cultureSettings);
    case "Tuesday":
      return operations.getNextWeeklyOccurrence(2, fromDate, cultureSettings);
    case "Wednesday":
      return operations.getNextWeeklyOccurrence(3, fromDate, cultureSettings);
    case "Thursday":
      return operations.getNextWeeklyOccurrence(4, fromDate, cultureSettings);
    case "Friday":
      return operations.getNextWeeklyOccurrence(5, fromDate, cultureSettings);
    case "Saturday":
      return operations.getNextWeeklyOccurrence(6, fromDate, cultureSettings);
    case "Sunday":
      return operations.getNextWeeklyOccurrence(0, fromDate, cultureSettings);
    case "MonthlyDay":
      return operations.getNextMonthlyOccurrence(rule, fromDate, cultureSettings);
    case "Date":
      return operations.getNextDateOccurrence(rule, fromDate, cultureSettings);
    default:
      return assertNever(rule.ruleType);
  }
}
