import type { Holiday } from "./getHolidays";

export function mergeHolidayNames(holidays: readonly Holiday[]): readonly string[] {
  return [...new Set(holidays.map(({ name }) => name))];
}
