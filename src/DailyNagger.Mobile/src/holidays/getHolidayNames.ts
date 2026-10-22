import { getHolidays, type HolidayCountryCode } from "./getHolidays";
import { mergeHolidayNames } from "./mergeHolidayNames";

export function getHolidayNames(country: HolidayCountryCode): readonly string[] {
  return mergeHolidayNames(getHolidays(country));
}
