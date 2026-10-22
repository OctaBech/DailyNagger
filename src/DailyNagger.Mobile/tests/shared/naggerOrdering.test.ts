import { describe, expect, it, jest } from "@jest/globals";
import type { Nagger } from "@/models/clientModel";
import { orderNaggersForPlanList } from "@/models/naggerOrdering";
import { getTargetMinuteSortValue } from "@/app-day";
import { buildNagPlanListItems } from "@/features/nag-plan/list/buildNagPlanListItems";
import { zipNaggersAndHolidays } from "@/features/nag-plan/list/zipNaggersAndHolidays";

jest.mock("uuid", () => ({ v7: () => "unused-test-id" }));

function nagger(id: string, targetTime: string | null, dueOn: string | null = "2026-10-20") {
  return { id, title: id, targetTime, activeLogDueOn: dueOn, pinnedBy: "None" } as Nagger;
}

describe("plan ordering from the rollover day boundary", () => {
  it("places early-morning times after evening without changing the original data", () => {
    const input = [
      nagger("early-morning", "02:00"),
      nagger("evening", "21:00"),
      nagger("morning", "08:00"),
      nagger("day-start", "05:00"),
      nagger("day-end", "04:59"),
      nagger("any-time", null),
    ];
    const ordered = orderNaggersForPlanList(input);

    expect(ordered.map((item) => item.id)).toEqual([
      "day-start",
      "morning",
      "evening",
      "early-morning",
      "day-end",
      "any-time",
    ]);
    expect(ordered[3]).toBe(input[0]);
    expect(ordered[3].targetTime).toBe("02:00");
    expect(ordered[3].activeLogDueOn).toBe("2026-10-20");
    expect(input[0].id).toBe("early-morning");
    expect(getTargetMinuteSortValue("05:00")).toBe(0);
    expect(getTargetMinuteSortValue("04:59")).toBe(1439);
  });

  it("still orders by due date first and leaves undated tasks last", () => {
    const ordered = orderNaggersForPlanList([
      nagger("tomorrow", "05:00", "2026-10-21"),
      nagger("undated", "05:00", null),
      nagger("today-night", "02:00"),
    ]);
    expect(ordered.map((item) => item.id)).toEqual(["today-night", "tomorrow", "undated"]);
  });

  it("keeps both sides of midnight together in the existing Night section", () => {
    const items = buildNagPlanListItems(
      zipNaggersAndHolidays(
        [
          nagger("after-midnight", "02:00"),
          nagger("morning", "08:00"),
          nagger("before-midnight", "21:00"),
        ],
        [],
      ),
    );
    expect(items.filter((item) => item.kind === "time-section").map((item) => item.title)).toEqual([
      "Morning",
      "Night",
    ]);
  });
});
