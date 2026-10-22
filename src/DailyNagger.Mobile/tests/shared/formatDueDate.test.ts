import { describe, expect, it } from "@jest/globals";
import { formatDueDate } from "@/app-day";

describe("formatDueDate", () => {
  it("formats section and card text from the same dates", () => {
    expect(formatDueDate("2026-10-23", "section", "2026-10-20")).toBe("In 3 days · Friday, 23 Oct");
    expect(formatDueDate("2026-10-23", "card", "2026-10-20")).toBe("Due Fri, 23 Oct (in 3 days)");
  });

  it("uses today and tomorrow relative to the supplied app date", () => {
    expect(formatDueDate("2026-10-20", "section", "2026-10-20")).toBe("Today · Tuesday, 20 Oct");
    expect(formatDueDate("2026-10-21", "card", "2026-10-20")).toBe("Due Wed, 21 Oct (tomorrow)");
  });

  it("labels undated cards and sections without inventing a due date", () => {
    expect(formatDueDate(null, "section", "2026-10-20")).toBe("No scheduled date");
    expect(formatDueDate(null, "card", "2026-10-20")).toBe("No scheduled date");
  });

  it("handles past dates without a negative countdown", () => {
    expect(formatDueDate("2026-10-19", "section", "2026-10-20")).toBe("Yesterday · Monday, 19 Oct");
    expect(formatDueDate("2026-10-17", "card", "2026-10-20")).toBe("Due Sat, 17 Oct (3 days ago)");
  });

  it("counts calendar days across month, year, and daylight-saving boundaries", () => {
    expect(formatDueDate("2027-01-02", "section", "2026-12-31")).toBe(
      "In 2 days · Saturday, 2 Jan",
    );
    expect(formatDueDate("2026-03-30", "section", "2026-03-28")).toBe("In 2 days · Monday, 30 Mar");
    expect(formatDueDate("2026-10-26", "section", "2026-10-24")).toBe("In 2 days · Monday, 26 Oct");
  });

  it("rejects timestamps instead of silently returning a NaN countdown", () => {
    expect(() => formatDueDate("2026-10-20", "section", "2026-10-20T02:00:00Z")).toThrow(
      "Cannot format due date: expected YYYY-MM-DD dates.",
    );
  });
});
