import { HOLIDAY_PROVIDER_CONTRACT, getHolidayProviderRuntimeVersion } from "./holidayProvider";

export function assertHolidayProviderVersionContract(): void {
  const runtimeVersion = getHolidayProviderRuntimeVersion();

  if (runtimeVersion !== HOLIDAY_PROVIDER_CONTRACT.version) {
    throw new Error(
      `Holiday provider version changed from ${HOLIDAY_PROVIDER_CONTRACT.version} to ${runtimeVersion}. Review holiday mappings before accepting the new version.`,
    );
  }
}
