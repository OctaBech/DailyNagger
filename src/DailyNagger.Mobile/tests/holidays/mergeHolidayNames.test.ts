import { describe, expect, it } from "@jest/globals";
import { mergeHolidayNames } from "@/holidays/mergeHolidayNames";

describe("mergeHolidayNames", () => {
  it("returns each name once in first-occurrence order without changing the source", () => {
    const holidays = Object.freeze([
      Object.freeze({ name: "Christmas Day", date: "2026-12-25" }),
      Object.freeze({ name: "New Year's Day", date: "2027-01-01" }),
      Object.freeze({ name: "Christmas Day", date: "2027-12-25" }),
    ]);
    expect(mergeHolidayNames(holidays)).toEqual(["Christmas Day", "New Year's Day"]);
    expect(holidays).toHaveLength(3);
  });

  it("keeps different holidays on the same date", () => {
    expect(
      mergeHolidayNames([
        { name: "First holiday", date: "2027-05-01" },
        { name: "Second holiday", date: "2027-05-01" },
      ]),
    ).toEqual(["First holiday", "Second holiday"]);
  });

  it("returns an empty array for an empty list", () => {
    expect(mergeHolidayNames([])).toEqual([]);
  });
});
