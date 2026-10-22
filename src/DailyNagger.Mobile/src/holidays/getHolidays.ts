import Holidays from "date-holidays";
import { getCurrentAppDate } from "@/app-day";

export const holidayCountries = ["DK", "US"] as const;
export type HolidayCountryCode = (typeof holidayCountries)[number];

export type Holiday = {
  readonly name: string;
  readonly date: string;
};

export function getHolidays(
  country: HolidayCountryCode,
  today: string = getCurrentAppDate(),
): readonly Holiday[] {
  const [year, month, day] = today.split("-").map(Number);
  const end = new Date(Date.UTC(year, month - 1 + 18, 1));
  // Clamp month-end dates instead of overflowing into the following month.
  const lastDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate();
  end.setUTCDate(Math.min(day, lastDay));
  const endDate = end.toISOString().slice(0, 10);
  const provider = new Holidays(country);
  const years = Array.from({ length: end.getUTCFullYear() - year + 1 }, (_, index) => year + index);

  return years
    .flatMap((holidayYear) => provider.getHolidays(holidayYear))
    .map(({ name, date }) => ({ name, date: date.slice(0, 10) }))
    .filter(({ date }) => date >= today && date < endDate)
    .sort((left, right) => left.date.localeCompare(right.date));
}
