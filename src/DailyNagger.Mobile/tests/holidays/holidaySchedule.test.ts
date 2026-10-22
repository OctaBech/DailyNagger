import { describe, expect, it, jest } from "@jest/globals";
import { operations } from "@/services/schedule-calculator/operations";
import type { CultureSettings } from "@/services/culture";

jest.mock("uuid", () => ({ v7: () => "unused-test-id" }));

function toLocalIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const culture: CultureSettings = {
  isUsingCommaForDecimals: false,
  getNow: () => new Date(),
  getTodayLocalIsoDate: () => toLocalIsoDate(new Date()),
  parseLocalIsoDate: (date) => {
    const [year, month, day] = date.split("-").map(Number);
    return new Date(year, month - 1, day);
  },
  toLocalIsoDate,
  getUserTimeZone: () => "Europe/Copenhagen",
  getUserLocale: () => "en-GB",
};

function next(holidayId: string, from: string, countryCode = "DK") {
  return operations.getNextHolidayOccurrence(
    { holidayId, countryCode },
    culture.parseLocalIsoDate(from),
    culture,
  );
}

describe("holiday selections from the modal", () => {
  it("calculates a newly selected package name", () => {
    expect(next("Easter Sunday", "2026-10-22")).toBe("2027-03-28");
    expect(next("Christmas Eve", "2026-12-24")).toBe("2026-12-24");
  });

  it("finds next year's occurrence after the date has passed", () => {
    expect(next("Christmas Eve", "2026-12-25")).toBe("2027-12-24");
  });

  it("builds from the calculation's date, not the current clock", () => {
    expect(next("Christmas Eve", "2031-10-22")).toBe("2031-12-24");
  });

  it("uses the selected country and rejects missing matches", () => {
    expect(next("Independence Day", "2026-10-22", "US")).toBe("2027-07-04");
    expect(next("Independence Day", "2026-10-22")).toBeNull();
    expect(next("Christmas Eve", "2026-10-22", "unknown")).toBeNull();
  });
});
