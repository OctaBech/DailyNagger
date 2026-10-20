import { describe, expect, it, jest } from "@jest/globals";
import { createDialMenuBuilder } from "@/components/speed-dial/createDialMenuBuilder";
import type { SpeedDialMenuItem } from "@/components/speed-dial/SpeedDialMenu";

const option = {
  key: "save",
  label: "Save",
  iconType: "vector",
  iconValue: "content-save",
} as const;

describe("dial menu builder", () => {
  it("starts empty and groups options into successive rows", () => {
    const builder = createDialMenuBuilder();
    expect(builder.getMenuArray()).toEqual([]);
    builder.addOption({ ...option, row: "new" });
    builder.addOption({ ...option, key: "cancel", row: "current" });
    builder.addOption({ ...option, key: "undo", row: "new" });
    expect(builder.getMenuArray().map(({ key, row }) => ({ key, row }))).toEqual([
      { key: "save", row: 0 },
      { key: "cancel", row: 0 },
      { key: "undo", row: 1 },
    ]);
  });

  it("uses row zero when current is the first option", () => {
    const builder = createDialMenuBuilder();
    builder.addOption({ ...option, row: "current" });
    expect(builder.getMenuArray()[0].row).toBe(0);
  });

  it("extends an existing menu after its highest row without changing it", () => {
    const onSelect = jest.fn();
    const initial: readonly SpeedDialMenuItem[] = Object.freeze([
      Object.freeze({ ...option, row: 3, onSelect, isDisabled: true }),
      Object.freeze({ ...option, key: "other", row: 1 }),
    ]);
    const builder = createDialMenuBuilder(initial);
    builder.addOption({ ...option, key: "filter", row: "new" });
    expect(builder.getMenuArray().map(({ row }) => row)).toEqual([3, 1, 4]);
    expect(initial).toHaveLength(2);
    expect(builder.getMenuArray()[0]).toEqual(initial[0]);
    builder.getMenuArray()[0].onSelect?.();
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("preserves implicit rows and returns independent array snapshots", () => {
    const builder = createDialMenuBuilder([option, { ...option, key: "cancel" }]);
    const before = builder.getMenuArray();
    builder.addOption({ ...option, key: "filter", row: "new" });
    expect(before.map(({ row }) => row)).toEqual([0, 1]);
    expect(builder.getMenuArray().map(({ row }) => row)).toEqual([0, 1, 2]);
  });
});
