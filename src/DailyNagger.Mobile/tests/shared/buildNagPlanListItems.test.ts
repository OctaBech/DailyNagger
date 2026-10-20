import { describe, expect, it, jest } from "@jest/globals";
import type { Nagger } from "@/models/clientModel";
import { buildNagPlanListItems } from "@/features/nag-plan/buildNagPlanListItems";

jest.mock("uuid", () => ({ v7: () => "unused-test-id" }));

function nagger(id: string, dueOn: string | null, pinnedBy: "None" | "User" = "None") {
  return { id, title: id, activeLogDueOn: dueOn, targetTime: "08:00", pinnedBy } as Nagger;
}

describe("plan section headers", () => {
  it("keeps all pinned cards at the top without date or time headers", () => {
    const dated = nagger("pinned-dated", "2026-10-20", "User");
    const undated = nagger("pinned-undated", null, "User");
    expect(buildNagPlanListItems([undated, dated], "2026-10-20")).toEqual([
      { kind: "nagger", id: "nagger:pinned-dated", nagger: dated },
      { kind: "nagger", id: "nagger:pinned-undated", nagger: undated },
    ]);
  });

  it("shows a fresh time header under every new date, even with pinned cards on that date", () => {
    const items = buildNagPlanListItems(
      [
        nagger("today", "2026-10-20"),
        nagger("tomorrow", "2026-10-21"),
        nagger("pinned", "2026-10-20", "User"),
      ],
      "2026-10-20",
    );
    expect(items.filter((item) => item.kind === "date-section").map((item) => item.title)).toEqual([
      "Today · Tuesday, 20 October",
      "Tomorrow · Wednesday, 21 October",
    ]);
    expect(items.filter((item) => item.kind === "time-section").map((item) => item.title)).toEqual([
      "Morning",
      "Morning",
    ]);
    expect(items.filter((item) => item.kind === "nagger")).toHaveLength(3);
  });

  it("groups undated cards under one heading without time headers, including an all-undated list", () => {
    const items = buildNagPlanListItems([nagger("a", null), nagger("b", null)], "2026-10-20");
    expect(items.map((item) => item.kind)).toEqual(["date-section", "nagger", "nagger"]);
    expect(items[0]).toEqual({
      kind: "date-section",
      id: "date-section:unscheduled",
      title: "No scheduled date",
    });
  });

  it("places the undated group after the dated groups and leaves an empty list empty", () => {
    const items = buildNagPlanListItems(
      [nagger("undated", null), nagger("today", "2026-10-20")],
      "2026-10-20",
    );
    expect(items.filter((item) => item.kind === "date-section").map((item) => item.title)).toEqual([
      "Today · Tuesday, 20 October",
      "No scheduled date",
    ]);
    expect(buildNagPlanListItems([], "2026-10-20")).toEqual([]);
  });
});
