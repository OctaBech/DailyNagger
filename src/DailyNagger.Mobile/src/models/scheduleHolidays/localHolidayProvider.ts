export type HolidayCountryCode = "DK" | "US";

export type HolidayProviderDefinition = {
  readonly countryCode: HolidayCountryCode;
  readonly holidayId: string;
  readonly label: string;
  readonly getDate: (year: number) => Date;
};

export const localHolidayProviderVersion = "local-2026-08-18";

export const holidayCountries = [
  { label: "DK", value: "DK" },
  { label: "US", value: "US" },
] as const satisfies readonly { readonly label: string; readonly value: HolidayCountryCode }[];

export const localHolidayDefinitions = [
  {
    countryCode: "DK",
    holidayId: "mothers_day",
    label: "Mors dag",
    getDate: (year) => getNthWeekdayOfMonth(year, 5, 0, 2),
  },
  {
    countryCode: "DK",
    holidayId: "constitution_day",
    label: "Grundlovsdag",
    getDate: (year) => new Date(year, 5 - 1, 5),
  },
  {
    countryCode: "DK",
    holidayId: "christmas_eve",
    label: "Juleaften",
    getDate: (year) => new Date(year, 12 - 1, 24),
  },
  {
    countryCode: "DK",
    holidayId: "christmas_day",
    label: "Juledag",
    getDate: (year) => new Date(year, 12 - 1, 25),
  },
  {
    countryCode: "DK",
    holidayId: "boxing_day",
    label: "2. juledag",
    getDate: (year) => new Date(year, 12 - 1, 26),
  },
  {
    countryCode: "US",
    holidayId: "mothers_day",
    label: "Mother's Day",
    getDate: (year) => getNthWeekdayOfMonth(year, 5, 0, 2),
  },
  {
    countryCode: "US",
    holidayId: "independence_day",
    label: "Independence Day",
    getDate: (year) => new Date(year, 7 - 1, 4),
  },
  {
    countryCode: "US",
    holidayId: "thanksgiving",
    label: "Thanksgiving",
    getDate: (year) => getNthWeekdayOfMonth(year, 11, 4, 4),
  },
  {
    countryCode: "US",
    holidayId: "christmas_day",
    label: "Christmas Day",
    getDate: (year) => new Date(year, 12 - 1, 25),
  },
] as const satisfies readonly HolidayProviderDefinition[];

function getNthWeekdayOfMonth(
  year: number,
  month: number,
  dayOfWeek: number,
  position: number,
): Date {
  const firstOfMonth = new Date(year, month - 1, 1);
  const daysUntilTarget = (dayOfWeek - firstOfMonth.getDay() + 7) % 7;

  return new Date(year, month - 1, 1 + daysUntilTarget + (position - 1) * 7);
}
