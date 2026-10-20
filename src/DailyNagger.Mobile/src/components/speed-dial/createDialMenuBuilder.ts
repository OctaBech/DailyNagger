import type { SpeedDialMenuItem } from "./SpeedDialMenu";

type DialMenuOption = Omit<SpeedDialMenuItem, "row"> & {
  readonly row: "new" | "current";
};

export function createDialMenuBuilder(initialItems: readonly SpeedDialMenuItem[] = []) {
  const items: (SpeedDialMenuItem & { readonly row: number })[] = initialItems.map(
    (item, index) => ({
      ...item,
      row: item.row ?? index,
    }),
  );
  let currentRow = items.reduce((highest, item) => Math.max(highest, item.row), -1);

  return {
    addOption({ row, ...option }: DialMenuOption): void {
      if (row === "new" || currentRow < 0) currentRow++;
      items.push({ ...option, row: currentRow });
    },
    getMenuArray(): readonly SpeedDialMenuItem[] {
      return [...items];
    },
  };
}
