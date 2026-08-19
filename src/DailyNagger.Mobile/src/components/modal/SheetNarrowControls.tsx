import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

type SheetNarrowControlsProps = {
  readonly search: ReactNode;
  readonly sort?: ReactNode;
};

export function SheetNarrowControls({ search, sort }: SheetNarrowControlsProps) {
  if (sort === undefined) {
    return <View>{search}</View>;
  }

  return (
    <View style={styles.row}>
      <View style={styles.searchSlot}>{search}</View>
      <View style={styles.sortSlot}>{sort}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  searchSlot: {
    flexBasis: "55%",
    minWidth: 0,
  },
  sortSlot: {
    flexShrink: 0,
  },
});
