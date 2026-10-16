import { describe, expect, it } from "@jest/globals";
import { createScreenPositionHandoff } from "@/app-shell/screen-position-handoff/createScreenPositionHandoff";

describe("screen position handoff", () => {
  it("uses the current relative position for editor placement and debug after scrolling", () => {
    const handoff = createScreenPositionHandoff();
    handoff.plan.setScrollY(50);
    handoff.plan.setNaggerTopY("nagger", 300);

    handoff.plan.setScrollY(250);
    expect(handoff.readEditorPlacement("nagger")).toMatchObject({
      sourceTopY: 100,
      topFillerHeight: 100,
      initialScrollY: 0,
    });
    expect(handoff.debug.getSnapshot().plan.naggerTopY).toBe(100);

    handoff.plan.setScrollY(400);
    expect(handoff.readEditorPlacement("nagger")).toMatchObject({
      sourceTopY: -50,
      topFillerHeight: 0,
      initialScrollY: 50,
    });
    expect(handoff.debug.getSnapshot().plan.naggerTopY).toBe(-50);

    handoff.plan.setScrollY(250);
    expect(handoff.readEditorPlacement("nagger")?.sourceTopY).toBe(100);
    expect(handoff.debug.getSnapshot().plan.naggerTopY).toBe(100);
  });

  it("uses a fresh measurement as the new baseline, including on the return to plan", () => {
    const handoff = createScreenPositionHandoff();
    handoff.editor.setScrollY(80);
    handoff.editor.setNaggerTopY("nagger", 200);
    handoff.editor.setScrollY(120);
    handoff.editor.setNaggerTopY("nagger", 170);
    handoff.editor.setScrollY(150);
    handoff.plan.setScrollY(500);

    expect(handoff.readPlanPlacement("nagger", 240)).toMatchObject({
      sourceTopY: 140,
      nextScrollY: 600,
    });
    expect(handoff.debug.getSnapshot().editor.naggerTopY).toBe(140);
  });

  it("does not invent a card position before a measurement exists", () => {
    const handoff = createScreenPositionHandoff();
    handoff.plan.setScrollY(100);

    expect(handoff.readEditorPlacement("nagger")).toBeNull();
    expect(handoff.debug.getSnapshot().plan.naggerTopY).toBeNull();
  });
});
