import { getLocales } from "expo-localization";
import { useMemo } from "react";

export type CultureSettings = ReturnType<typeof useCultureSettings>;

export function useCultureSettings() {
  const isUsingCommaForDecimals = useMemo(() => {
    const locales = getLocales();
    return locales.length > 0 && locales[0].decimalSeparator === ",";
  }, []);

  return useMemo(
    () => ({
      isUsingCommaForDecimals,
      getNow,
      getTodayLocalIsoDate,
      parseLocalIsoDate,
      toLocalIsoDate,
      getUserTimeZone,
      getUserLocale,
    }),
    [isUsingCommaForDecimals],
  );
}

function getNow(): Date {
  return new Date();
}

function getTodayLocalIsoDate(): string {
  const today = getNow();
  return toLocalIsoDate(today);
}

function parseLocalIsoDate(localIsoDate: string): Date {
  const [year, month, day] = localIsoDate.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getUserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function getUserLocale(): string {
  return Intl.DateTimeFormat().resolvedOptions().locale;
}
