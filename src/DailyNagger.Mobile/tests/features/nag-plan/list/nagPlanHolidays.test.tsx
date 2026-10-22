import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { renderHook } from "@testing-library/react-native";
import type { Nagger } from "@/models/clientModel";
import { getHolidays, type Holiday } from "@/holidays";
import { zipNaggersAndHolidays } from "@/features/nag-plan/list/zipNaggersAndHolidays";
import { cutAfterLastNagger } from "@/features/nag-plan/list/cutAfterLastNagger";
import { buildNagPlanListItems } from "@/features/nag-plan/list/buildNagPlanListItems";
import { useNagPlanListItems } from "@/features/nag-plan/list/useNagPlanListItems";

jest.mock("uuid", () => ({ v7: () => "unused-test-id" }));
jest.mock("@/holidays", () => ({ getHolidays: jest.fn() }));

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

function nagger(id: string, date: string | null, pinnedBy: "None" | "User" = "None") {
  return { id, title: id, activeLogDueOn: date, targetTime: "08:00", pinnedBy } as Nagger;
}
const holidays: readonly Holiday[] = [
  { name: "First holiday", date: "2026-10-20" },
  { name: "Second holiday", date: "2026-10-21" },
  { name: "Later holiday", date: "2026-12-25" },
];

describe("zip and cut plan entries", () => {
  it("merges by date, with same-day holidays before cards, pinned first and undated last", () => {
    const entries = zipNaggersAndHolidays(
      [
        nagger("undated", null),
        nagger("dated", "2026-10-21"),
        nagger("pinned", "2026-12-30", "User"),
      ],
      [...holidays].reverse(),
    );
    expect(
      entries.map((entry) => (entry.kind === "nagger" ? entry.nagger.id : entry.holiday.name)),
    ).toEqual(["pinned", "First holiday", "Second holiday", "dated", "Later holiday", "undated"]);
    expect(holidays[0].name).toBe("First holiday");
  });

  it("cuts only the trailing holidays, keeping holidays before matching cards", () => {
    const entries = zipNaggersAndHolidays([nagger("match", "2026-10-21")], holidays);
    const cut = cutAfterLastNagger(entries);
    expect(cut.map(({ kind }) => kind)).toEqual(["holiday", "holiday", "nagger"]);
    expect(entries).toHaveLength(4);
    expect(cutAfterLastNagger(zipNaggersAndHolidays([], holidays))).toEqual([]);
  });

  it("shares one date header and does not create time sections for holiday-only dates", () => {
    const items = buildNagPlanListItems(
      zipNaggersAndHolidays([nagger("match", "2026-10-21")], holidays),
      "2026-10-20",
    );
    expect(items.map(({ kind }) => kind)).toEqual([
      "date-section",
      "holiday",
      "date-section",
      "holiday",
      "time-section",
      "nagger",
      "date-section",
      "holiday",
    ]);
    expect(
      items.filter((item) => item.kind === "date-section" && item.id === "date-section:2026-10-21"),
    ).toHaveLength(1);
  });

  it("retains undated cards and handles lists containing only pinned cards", () => {
    expect(
      cutAfterLastNagger(zipNaggersAndHolidays([nagger("undated", null)], holidays)),
    ).toHaveLength(4);
    expect(
      cutAfterLastNagger(zipNaggersAndHolidays([nagger("pinned", null, "User")], holidays)),
    ).toHaveLength(1);
  });
});

describe("plan-list wiring", () => {
  it("loads holidays once, limits display to twelve months, and cuts only during filtering", async () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 9, 20, 12));
    jest
      .mocked(getHolidays)
      .mockReturnValue([...holidays, { name: "Outside view", date: "2027-12-25" }]);
    const nags = [nagger("match", "2026-10-21"), nagger("other", "2026-12-31")];
    const { result, rerender } = await renderHook(
      ({ naggers, query }: { naggers: readonly Nagger[]; query: string }) =>
        useNagPlanListItems(naggers, query),
      { initialProps: { naggers: nags, query: "" } },
    );
    const initial = result.current;
    expect(initial.filter(({ kind }) => kind === "holiday")).toHaveLength(3);
    await rerender({ naggers: nags, query: "" });
    expect(result.current).toBe(initial);
    await rerender({ naggers: nags, query: "MATCH" });
    expect(result.current.filter(({ kind }) => kind === "holiday")).toHaveLength(2);
    expect(
      result.current.filter((item) => item.kind === "nagger").map((item) => item.nagger.id),
    ).toEqual(["match"]);
    await rerender({ naggers: nags, query: "missing" });
    expect(result.current).toEqual([]);
    await rerender({ naggers: nags, query: "   " });
    expect(result.current.filter(({ kind }) => kind === "holiday")).toHaveLength(3);
    expect(getHolidays).toHaveBeenCalledTimes(1);
  });
});
