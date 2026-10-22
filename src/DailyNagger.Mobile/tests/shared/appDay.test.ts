import { afterEach, describe, expect, it, jest } from "@jest/globals";
import {
  formatDueDate,
  getCurrentAppDate,
  getNextAppDayStart,
  getTargetMinuteSortValue,
  getTimeSection,
} from "@/app-day";
import { appTiming } from "@/config/appTiming";

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe("app day", () => {
  it("changes the local app date at 05:00, not midnight", () => {
    expect(getCurrentAppDate(new Date(2026, 9, 20, 2))).toBe("2026-10-19");
    expect(getCurrentAppDate(new Date(2026, 9, 20, 4, 59, 59))).toBe("2026-10-19");
    expect(getCurrentAppDate(new Date(2026, 9, 20, 5))).toBe("2026-10-20");
  });

  it("handles month/year changes without mutating the supplied clock", () => {
    const now = new Date(2027, 0, 1, 2);
    expect(getCurrentAppDate(now)).toBe("2026-12-31");
    expect(now.getDate()).toBe(1);
    expect(getCurrentAppDate(new Date(2026, 3, 1, 2))).toBe("2026-03-31");
  });

  it("uses the configured boundary for both dates and sort keys", () => {
    jest.replaceProperty(
      appTiming.rollover as { dayBoundaryTime: string },
      "dayBoundaryTime",
      "06:30",
    );
    expect(getCurrentAppDate(new Date(2026, 9, 20, 6, 29))).toBe("2026-10-19");
    expect(getCurrentAppDate(new Date(2026, 9, 20, 6, 30))).toBe("2026-10-20");
    expect(getTargetMinuteSortValue("06:30")).toBe(0);
    expect(getTargetMinuteSortValue("06:29")).toBe(1439);
    expect(getNextAppDayStart("2026-10-20").getHours()).toBe(6);
    expect(getNextAppDayStart("2026-10-20").getMinutes()).toBe(30);
  });

  it("finds the next local boundary across daylight-saving and year changes", () => {
    for (const [appDate, year, month, day] of [
      ["2026-03-28", 2026, 2, 29],
      ["2026-10-24", 2026, 9, 25],
      ["2026-12-31", 2027, 0, 1],
    ] as const) {
      const next = getNextAppDayStart(appDate);
      expect(next.getFullYear()).toBe(year);
      expect(next.getMonth()).toBe(month);
      expect(next.getDate()).toBe(day);
      expect(next.getHours()).toBe(5);
    }
  });

  it("retains the original clock times for sections on both sides of midnight", () => {
    expect(getTimeSection("04:59").title).toBe("Night");
    expect(getTimeSection("05:00").title).toBe("Morning");
    expect(getTimeSection("12:00").title).toBe("Afternoon");
    expect(getTimeSection("17:00").title).toBe("Evening");
    expect(getTimeSection("21:00").title).toBe("Night");
    expect(getTimeSection(null).title).toBe("Any time");
  });

  it("lets date formatting use the app date by default", () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 9, 20, 2));
    expect(formatDueDate("2026-10-19", "section")).toBe("Today · Monday, 19 Oct");
    expect(formatDueDate("2026-10-20", "card")).toBe("Due tomorrow");
  });
});
