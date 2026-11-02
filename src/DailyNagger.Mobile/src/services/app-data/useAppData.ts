import { useMemo } from "react";
import { createRequiredContext } from "@/shared/createRequiredContext";
import type { Nagger, ScheduleRule } from "@/models";
import type { CultureSettings } from "../culture";
import { scheduleCalculator } from "../schedule-calculator";

export type AppData = ReturnType<typeof useCreateAppData>;

export const { Provider: AppDataProvider, useRequiredContext: useAppData } =
  createRequiredContext<AppData>("AppDataContext");

export function useCreateAppData(cultureSettings: CultureSettings) {
  return useMemo(
    () => ({
      ...cultureSettings,
      decimalSeparator: (cultureSettings.isUsingCommaForDecimals ? "," : ".") as "." | ",",
      getNextDueOn: (nagger: Nagger, scheduleRules: readonly ScheduleRule[]) =>
        scheduleCalculator.getNextDueOn({ ...nagger, scheduleRules }, cultureSettings),
    }),
    [cultureSettings],
  );
}
