import type { ScheduleRule } from "@/models";
import type { CultureSettings } from "../culture";

export const operations = {
  getNextWeeklyOccurrence,
  getNextMonthlyOccurrence,
  getNextDateOccurrence,
} as const;

function getNextWeeklyOccurrence(
  dayOfWeek: number,
  fromDate: Date,
  cultureSettings: CultureSettings,
): string {
  const daysUntilTarget = (dayOfWeek - fromDate.getDay() + 7) % 7;
  const candidate = addDays(fromDate, daysUntilTarget);

  return cultureSettings.toLocalIsoDate(candidate);
}

function getNextMonthlyOccurrence(
  rule: ScheduleRule,
  fromDate: Date,
  cultureSettings: CultureSettings,
): string | null {
  if (rule.day === null) return null;

  let year = fromDate.getFullYear();
  let month = fromDate.getMonth() + 1;

  for (let monthsChecked = 0; monthsChecked < 24; monthsChecked++) {
    if (isValidLocalDate(year, month, rule.day)) {
      const candidate = new Date(year, month - 1, rule.day);

      if (candidate >= fromDate) {
        return cultureSettings.toLocalIsoDate(candidate);
      }
    }

    month++;
    if (month <= 12) continue;

    year++;
    month = 1;
  }

  return null;
}

function getNextDateOccurrence(
  rule: ScheduleRule,
  fromDate: Date,
  cultureSettings: CultureSettings,
): string | null {
  if (rule.day === null || rule.month === null) return null;

  if (rule.year !== null) {
    if (!isValidLocalDate(rule.year, rule.month, rule.day)) return null;

    const exactDate = new Date(rule.year, rule.month - 1, rule.day);
    return exactDate >= fromDate ? cultureSettings.toLocalIsoDate(exactDate) : null;
  }

  let year = fromDate.getFullYear();

  for (let yearsChecked = 0; yearsChecked < 10; yearsChecked++) {
    if (isValidLocalDate(year, rule.month, rule.day)) {
      const candidate = new Date(year, rule.month - 1, rule.day);

      if (candidate >= fromDate) {
        return cultureSettings.toLocalIsoDate(candidate);
      }
    }

    year++;
  }

  return null;
}

function addDays(date: Date, days: number): Date {
  const newDate = new Date(date);
  newDate.setDate(date.getDate() + days);

  return newDate;
}

function isValidLocalDate(year: number, month: number, day: number): boolean {
  const date = new Date(year, month - 1, day);

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}
