import { appTiming } from "@/config/appTiming";

export function getCurrentAppDate(now: Date = new Date()): string {
  const appDate = new Date(now);
  const currentMinute = now.getHours() * 60 + now.getMinutes();
  if (currentMinute < getAppDayStartMinute()) appDate.setDate(appDate.getDate() - 1);

  const year = appDate.getFullYear();
  const month = String(appDate.getMonth() + 1).padStart(2, "0");
  const day = String(appDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getNextAppDayStart(appDate: string): Date {
  const [year, month, day] = appDate.split("-").map(Number);
  const dayStartMinute = getAppDayStartMinute();
  // Construct the next local calendar date rather than adding 24 hours across DST.
  return new Date(year, month - 1, day + 1, Math.floor(dayStartMinute / 60), dayStartMinute % 60);
}

export function getTargetMinuteSortValue(targetTime: string | null): number {
  const targetMinute = parseTargetMinute(targetTime);
  if (targetMinute === null) return Number.POSITIVE_INFINITY;
  return (targetMinute - getAppDayStartMinute() + 1440) % 1440;
}

export function getAppDayStartMinute(): number {
  const minute = parseTargetMinute(appTiming.rollover.dayBoundaryTime);
  if (minute === null) throw new Error("Cannot read app day: invalid day boundary time.");
  return minute;
}

export function parseTargetMinute(targetTime: string | null): number | null {
  if (targetTime === null) return null;
  const [hours, minutes] = targetTime.split(":").map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}
