import { FlatList, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import type { Nagger } from "@/models";
import * as Input from "@/components/input";
import { TimeSectionHeader } from "@/components/primitives";
import { NagCard } from "./cards";
import { nagPlanTheme } from "./theme";
import { appLayout } from "@/config";
import { buildNagPlanListItems, type NagPlanListItem } from "./buildNagPlanListItems";

type NagListProps = {
  readonly nags: readonly Nagger[];
  readonly getScrollOffset: () => number;
  readonly setScrollOffset: (offset: number) => void;
};

const NagListComponent = ({ getScrollOffset, nags, setScrollOffset }: NagListProps) => {
  const listRef = useRef<FlatList<NagPlanListItem>>(null);
  const hasRestoredScrollOffsetRef = useRef(false);
  const { height: screenHeight } = useWindowDimensions();
  const bottomComfortSpace = screenHeight * nagPlanTheme.spacing.listBottomComfortScreenRatio;
  const listItems = useMemo(() => buildNagPlanListItems(nags), [nags]);
  const { keyboardInset, rememberScrollOffset: rememberKeyboardScrollOffset } =
    Input.useKeyboardFocusedInputScroller({
      getScrollOffset,
      listRef,
      setScrollOffset,
    });

  useEffect(() => {
    if (hasRestoredScrollOffsetRef.current) return;
    if (listItems.length === 0) return;

    hasRestoredScrollOffsetRef.current = true;
    const animationFrame = requestAnimationFrame(() => {
      const offset = getScrollOffset();
      if (offset <= 0) return;

      listRef.current?.scrollToOffset({ animated: false, offset });
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [getScrollOffset, listItems.length]);

  const rememberScrollOffset = useCallback(
    (event: { nativeEvent: { contentOffset: { y: number } } }) => {
      rememberKeyboardScrollOffset(event);
    },
    [rememberKeyboardScrollOffset],
  );

  return (
    <FlatList
      ref={listRef}
      style={[styles.list]}
      contentContainerStyle={[
        styles.listContent,
        { paddingBottom: bottomComfortSpace + keyboardInset },
      ]}
      data={listItems}
      ListHeaderComponent={__DEV__ ? <BuildMarker /> : null}
      renderItem={({ item }) => {
        if (item.kind === "time-section") {
          return <TimeSectionHeader title={item.title} rangeLabel={item.rangeLabel} />;
        }

        return <NagCard nagger={item.nagger} />;
      }}
      keyExtractor={(item) => item.id}
      ItemSeparatorComponent={() => <View style={styles.listGap} />}
      onScroll={rememberScrollOffset}
      scrollEventThrottle={16}
    />
  );
};

export const NagList = memo(NagListComponent);

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
    backgroundColor: nagPlanTheme.screen.background,
    flexGrow: 1,
    paddingHorizontal: nagPlanTheme.screenDensity.horizontalPadding,
    paddingTop: appLayout.moodBar.listTopPadding,
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
});
