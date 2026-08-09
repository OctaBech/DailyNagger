import { FlatList, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useRef } from "react";
import type { Nagger } from "@/models";
import * as Input from "@/components/input";
import { NagCard } from "./cards";
import { nagPlanTheme } from "./theme";

type NagListProps = {
  readonly nags: readonly Nagger[];
};

export const NagList = ({ nags }: NagListProps) => {
  const listRef = useRef<FlatList<Nagger>>(null);
  const scrollOffsetRef = useRef(0);
  const { height: screenHeight } = useWindowDimensions();
  const bottomComfortSpace = screenHeight * nagPlanTheme.spacing.listBottomComfortScreenRatio;
  const { keyboardInset, rememberScrollOffset } = Input.useKeyboardFocusedInputScroller({
    getScrollOffset: () => scrollOffsetRef.current,
    listRef,
    setScrollOffset: (offset) => {
      scrollOffsetRef.current = offset;
    },
  });

  return (
    <FlatList
      ref={listRef}
      style={[styles.list]}
      contentContainerStyle={[
        styles.listContent,
        { paddingBottom: bottomComfortSpace + keyboardInset },
      ]}
      data={nags}
      ListHeaderComponent={__DEV__ ? <BuildMarker /> : null}
      renderItem={({ item }) => <NagCard nagger={item} />}
      keyExtractor={(nagger: Nagger) => nagger.id}
      ItemSeparatorComponent={() => <View style={styles.listGap} />}
      onScroll={rememberScrollOffset}
      scrollEventThrottle={16}
    />
  );
};

function BuildMarker() {
  return (
    <View style={styles.buildMarker}>
      <Text style={styles.buildMarkerText}>DEV build: sheet-lift-only</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    backgroundColor: nagPlanTheme.screen.background,
  },
  listContent: {
    paddingHorizontal: nagPlanTheme.screenDensity.horizontalPadding,
  },
  listGap: {
    height: nagPlanTheme.spacing.listGap,
  },
  buildMarker: {
    alignSelf: "center",
    backgroundColor: "#1b1f24",
    borderColor: "#f1d56b",
    borderRadius: 6,
    borderWidth: 2,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  buildMarkerText: {
    color: "#f1d56b",
    fontSize: 12,
    fontWeight: "900",
  },
  emptyText: {
    color: nagPlanTheme.screen.text,
    fontSize: 16,
    fontWeight: "600",
  },
});
