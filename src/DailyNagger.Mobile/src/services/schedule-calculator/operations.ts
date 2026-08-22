import {
  SCHEDULE_EVERY,
  SCHEDULE_LAST_DAY,
  SCHEDULE_LAST_POSITION,
  getHolidayDefinition,
  type DateScheduleRuleBody,
  type HolidayScheduleRuleBody,
  type WeekdayScheduleRuleBody,
} from "@/models";
import type { CultureSettings } from "../culture";

export const operations = {
  getNextWeekdayOccurrence,
  getNextDateOccurrence,
  getNextHolidayOccurrence,
} as const;

function getNextWeekdayOccurrence(
  rule: WeekdayScheduleRuleBody,
  fromDate: Date,
  cultureSettings: CultureSettings,
): string | null {
  if (rule.position === SCHEDULE_EVERY && rule.month === SCHEDULE_EVERY) {
    if (rule.weekday === SCHEDULE_EVERY) {
      return cultureSettings.toLocalIsoDate(fromDate);
    }

    const daysUntilTarget = (toJavaScriptDay(rule.weekday) - fromDate.getDay() + 7) % 7;
    const candidate = addDays(fromDate, daysUntilTarget);

    return cultureSettings.toLocalIsoDate(candidate);
  }

  if (rule.weekday === SCHEDULE_EVERY) return null;

  let year = fromDate.getFullYear();
  let month = fromDate.getMonth() + 1;

  for (let monthsChecked = 0; monthsChecked < 24; monthsChecked++) {
    if (rule.month === SCHEDULE_EVERY || rule.month === month) {
      const candidate = getWeekdayCandidate(year, month, rule, fromDate);

      if (candidate !== null && candidate >= fromDate) {
        return cultureSettings.toLocalIsoDate(candidate);
      }
    }

    ({ year, month } = getNextMonth(year, month));
  }

  return null;
}

function getNextDateOccurrence(
  rule: DateScheduleRuleBody,
  fromDate: Date,
  cultureSettings: CultureSettings,
): string | null {
  const fixedYear = rule.year !== SCHEDULE_EVERY;
  const fixedMonth = rule.month !== SCHEDULE_EVERY;

  let year = fixedYear ? rule.year : fromDate.getFullYear();
  let month = fixedMonth ? rule.month : fromDate.getMonth() + 1;

  for (let monthsChecked = 0; monthsChecked < 120; monthsChecked++) {
    const candidate = getDateCandidate(year, month, rule.dayOfMonth, fromDate);

    if (candidate !== null && candidate >= fromDate) {
      if (!fixedYear || candidate.getFullYear() === rule.year) {
        return cultureSettings.toLocalIsoDate(candidate);
      }
    }

    if (fixedYear && fixedMonth) return null;

    if (fixedMonth) {
      year++;
    } else {
      ({ year, month } = getNextMonth(year, month));
    }

    if (fixedYear && year !== rule.year) return null;
  }

  return null;
}

function getNextHolidayOccurrence(
  rule: HolidayScheduleRuleBody,
  fromDate: Date,
  cultureSettings: CultureSettings,
): string | null {
  const holiday = getHolidayDefinition(rule.countryCode, rule.holidayId);

  if (holiday === null) return null;

  for (let yearOffset = 0; yearOffset < 10; yearOffset++) {
    const candidate = holiday.getDate(fromDate.getFullYear() + yearOffset);

    if (candidate >= fromDate) {
      return cultureSettings.toLocalIsoDate(candidate);
    }
  }

  return null;
}

function getWeekdayCandidate(
  year: number,
  month: number,
  rule: WeekdayScheduleRuleBody,
  fromDate: Date,
): Date | null {
  if (rule.position === SCHEDULE_EVERY) {
    const firstCandidateDate =
      year === fromDate.getFullYear() && month === fromDate.getMonth() + 1
        ? fromDate
        : new Date(year, month - 1, 1);
    const daysUntilTarget = (toJavaScriptDay(rule.weekday) - firstCandidateDate.getDay() + 7) % 7;
    const candidate = addDays(firstCandidateDate, daysUntilTarget);

    return candidate.getMonth() === month - 1 ? candidate : null;
  }

  if (rule.position === SCHEDULE_LAST_POSITION) {
    const lastOfMonth = new Date(year, month, 0);
    const daysBackToTarget = (lastOfMonth.getDay() - toJavaScriptDay(rule.weekday) + 7) % 7;

    return addDays(lastOfMonth, -daysBackToTarget);
  }

  const firstOfMonth = new Date(year, month - 1, 1);
  const daysUntilTarget = (toJavaScriptDay(rule.weekday) - firstOfMonth.getDay() + 7) % 7;
  const candidate = addDays(firstOfMonth, daysUntilTarget + (rule.position - 1) * 7);

  return candidate.getMonth() === month - 1 ? candidate : null;
}

function getDateCandidate(
  year: number,
  month: number,
  dayOfMonth: number,
  fromDate: Date,
): Date | null {
  if (dayOfMonth === SCHEDULE_EVERY) {
    if (year === fromDate.getFullYear() && month === fromDate.getMonth() + 1) {
      return fromDate;
    }

    return new Date(year, month - 1, 1);
  }

  const day = dayOfMonth === SCHEDULE_LAST_DAY ? getDaysInMonth(year, month) : dayOfMonth;

  if (!isValidLocalDate(year, month, day)) return null;

  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  const newDate = new Date(date);
  newDate.setDate(date.getDate() + days);

  return newDate;
}

function getNextMonth(
  year: number,
  month: number,
): { readonly year: number; readonly month: number } {
  if (month < 12) {
    return { year, month: month + 1 };
  }

  return { year: year + 1, month: 1 };
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function isValidLocalDate(year: number, month: number, day: number): boolean {
  const date = new Date(year, month - 1, day);

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function toJavaScriptDay(weekday: number): number {
  return weekday === 7 ? 0 : weekday;
}
