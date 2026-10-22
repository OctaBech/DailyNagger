import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { version } from "date-holidays/package.json";
import { getHolidays, getHolidayNames } from "@/holidays";

afterEach(() => {
  jest.useRealTimers();
});

describe("holiday adapter", () => {
  it("keeps the reviewed provider version explicit", () => {
    expect(version).toBe("3.37.0");
  });

  it("returns sorted name/date data across all years in the eighteen-month window", () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 9, 22, 12));
    const holidays = getHolidays("DK");
    expect(holidays).toContainEqual({ name: "Christmas Eve", date: "2026-12-24" });
    expect(holidays).toContainEqual({ name: "Christmas Eve", date: "2027-12-24" });
    expect(holidays).toContainEqual({ name: "Easter Sunday", date: "2028-04-16" });
    for (const holiday of holidays) {
      expect(Object.keys(holiday).sort()).toEqual(["date", "name"]);
      expect(holiday.date >= "2026-10-22" && holiday.date < "2028-04-22").toBe(true);
    }
    const dates = holidays.map(({ date }) => date);
    expect(dates).toEqual([...dates].sort());
  });

  it("returns unique names for the modal", () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 9, 22, 12));
    const names = getHolidayNames("DK");
    expect(names).toContain("Christmas Eve");
    expect(names).toEqual([...new Set(getHolidays("DK").map(({ name }) => name))]);
  });

  it("uses the requested country", () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 9, 22, 12));
    expect(getHolidays("US")).toContainEqual({ name: "Independence Day", date: "2027-07-04" });
    expect(getHolidayNames("DK")).not.toContain("Independence Day");
  });

  it("uses the app date before the 05:00 rollover", () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 11, 26, 3));
    expect(getHolidays("DK")).toContainEqual({ name: "Christmas Day", date: "2026-12-25" });
  });

  it("clamps the eighteen-month end date at month-end", () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 7, 31, 12));
    const holidays = getHolidays("DK");
    expect(holidays.length).toBeGreaterThan(0);
    expect(holidays.every(({ date }) => date >= "2026-08-31" && date < "2028-02-29")).toBe(true);
  });
});
