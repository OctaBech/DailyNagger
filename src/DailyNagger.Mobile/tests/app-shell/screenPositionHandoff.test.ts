import { describe, expect, it } from "@jest/globals";
import { createScreenPositionHandoff } from "@/app-shell/screen-position-handoff/createScreenPositionHandoff";

describe("screen position handoff", () => {
  it("clears the source after handoff while preserving the copied negative position", () => {
    const handoff = createScreenPositionHandoff();
    handoff.editor.setNaggerTopY("nagger", 200);
    handoff.editor.setScrollY(280);
    const placement = handoff.readPlanPlacement("nagger", 500)!;

    handoff.markPlanPlacementApplied(placement);

    expect(placement.sourceTopY).toBe(-80);
    expect(placement.nextScrollY).toBe(580);
    expect(handoff.readPlanPlacement("nagger", 500)).toBeNull();
    expect(handoff.debug.getSnapshot().editor).toEqual({
      scrollY: 0,
      naggerId: null,
      naggerTopY: null,
    });

    handoff.editor.setNaggerTopY("nagger", 100);
    handoff.editor.setScrollY(20);
    expect(handoff.readPlanPlacement("nagger", 500)?.sourceTopY).toBe(80);
  });

  it("also clears plan measurements after the editor takes over", () => {
    const handoff = createScreenPositionHandoff();
    handoff.plan.setNaggerTopY("nagger", 100);
    const placement = handoff.readEditorPlacement("nagger")!;

    handoff.markEditorPlacementApplied(placement);

    expect(placement.sourceTopY).toBe(100);
    expect(handoff.readEditorPlacement("nagger")).toBeNull();
    expect(handoff.debug.getSnapshot().plan.naggerTopY).toBeNull();
  });
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

    expect(handoff.readPlanPlacement("nagger", 740)).toMatchObject({
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

  it("returns to a negative editor position without using the old plan scroll", () => {
    const handoff = createScreenPositionHandoff();
    handoff.editor.setNaggerTopY("nagger", 200);
    handoff.editor.setScrollY(280);
    handoff.plan.setScrollY(900);

    expect(handoff.readPlanPlacement("nagger", 500)).toMatchObject({
      sourceTopY: -80,
      destinationTopY: 500,
      nextScrollY: 580,
    });
  });

  it("returns to a positive editor position without using the old plan scroll", () => {
    const handoff = createScreenPositionHandoff();
    handoff.editor.setNaggerTopY("nagger", 100);
    handoff.plan.setScrollY(900);

    expect(handoff.readPlanPlacement("nagger", 500)?.nextScrollY).toBe(400);
  });
});
