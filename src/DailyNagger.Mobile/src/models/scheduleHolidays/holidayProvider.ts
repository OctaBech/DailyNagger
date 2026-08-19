import {
  holidayCountries,
  localHolidayDefinitions,
  localHolidayProviderVersion,
  type HolidayCountryCode,
  type HolidayProviderDefinition,
} from "./localHolidayProvider";

export type { HolidayCountryCode };

export type HolidayDefinition = HolidayProviderDefinition;

export const HOLIDAY_PROVIDER_CONTRACT = {
  name: "daily-nagger-local-holidays",
  version: localHolidayProviderVersion,
} as const;

export { holidayCountries };

export function getHolidayDefinitions(countryCode: string): readonly HolidayDefinition[] {
  return localHolidayDefinitions.filter((holiday) => holiday.countryCode === countryCode);
}

export function getHolidayDefinition(
  countryCode: string,
  holidayId: string,
): HolidayDefinition | null {
  return localHolidayDefinitions.find(
    (holiday) => holiday.countryCode === countryCode && holiday.holidayId === holidayId,
  ) ?? null;
}

export function getHolidayProviderRuntimeVersion(): string {
  return localHolidayProviderVersion;
}
