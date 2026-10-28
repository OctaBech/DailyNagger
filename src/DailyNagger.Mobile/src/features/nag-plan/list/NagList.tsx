import { FlatList, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPlanPlacement, useScreenPositionHandoff } from "@/app-shell";
import type { Nagger } from "@/models";
import * as Components from "@/components";
import * as Input from "@/components/input";
import { DateSectionHeader, TimeSectionHeader } from "@/components/primitives";
import { NagCard } from "../cards";
import { nagPlanTheme } from "../theme";
import type { NagPlanListItem } from "./buildNagPlanListItems";
import { useNagPlanListItems } from "./useNagPlanListItems";
import { usePlanTitleFilter } from "./filter/usePlanTitleFilter";
import { PlanFilterBar } from "./filter/PlanFilterBar";
import { appVariant } from "@/config/appVariant";
import { DemoDataControls } from "@/features/demo/DemoDataControls";

const isDemo = appVariant === "demo";

type NagListProps = {
  readonly nags: readonly Nagger[];
  readonly getScrollOffset: () => number;
  readonly setScrollOffset: (offset: number) => void;
  readonly topPadding: number;
};

const NagListComponent = ({ getScrollOffset, nags, setScrollOffset, topPadding }: NagListProps) => {
  const screenPositionHandoff = useScreenPositionHandoff();
  const listRef = useRef<FlatList<NagPlanListItem>>(null);
  const hasRestoredScrollOffsetRef = useRef(false);
  const actualScrollOffsetRef = useRef(0);
  const [cardContentTopY, setCardContentTopY] = useState<number | null>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const { height: screenHeight } = useWindowDimensions();
  const bottomComfortSpace = screenHeight;
  const filter = usePlanTitleFilter();
  const previousFilterQueryRef = useRef(filter.query);
  const listItems = useNagPlanListItems(nags, filter.query);
  const selectedNaggerId = useMemo(
    () => nags.find((nagger) => nagger.clientProps.isSelected)?.id ?? null,
    [nags],
  );
  // Capture the editor's target once, before the new list starts measuring.
  const editorPlacement = useMemo(
    () =>
      selectedNaggerId === null
        ? null
        : screenPositionHandoff.readPlanPlacement(selectedNaggerId, 0),
    [screenPositionHandoff, selectedNaggerId],
  );
  const selectedItemIndex = listItems.findIndex(
    (item) => item.kind === "nagger" && item.nagger.id === selectedNaggerId,
  );
  const { keyboardInset, rememberScrollOffset: rememberKeyboardScrollOffset } =
    Input.useKeyboardFocusedInputScroller({
      autoScrollEnabled: !filter.isInputFocused,
      getScrollOffset,
      listRef,
      setScrollOffset,
    });

  useEffect(() => {
    if (hasRestoredScrollOffsetRef.current) return;
    if (listItems.length === 0) return;
    if (editorPlacement !== null) return;

    hasRestoredScrollOffsetRef.current = true;
    const animationFrame = requestAnimationFrame(() => {
      const offset = getScrollOffset();
      if (offset <= 0) return;

      listRef.current?.scrollToOffset({ animated: false, offset });
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [editorPlacement, getScrollOffset, listItems.length]);

  useEffect(() => {
    if (hasRestoredScrollOffsetRef.current) return;
    if (editorPlacement === null || cardContentTopY === null || contentHeight === 0) return;

    const placement = createPlanPlacement(
      editorPlacement.naggerId,
      editorPlacement.sourceTopY,
      cardContentTopY,
    );
    hasRestoredScrollOffsetRef.current = true;
    setScrollOffset(placement.nextScrollY);
    screenPositionHandoff.plan.setScrollY(placement.nextScrollY);
    screenPositionHandoff.markPlanPlacementApplied(placement);
    listRef.current?.scrollToOffset({ animated: false, offset: placement.nextScrollY });
  }, [cardContentTopY, contentHeight, editorPlacement, screenPositionHandoff, setScrollOffset]);

  useEffect(() => {
    if (previousFilterQueryRef.current === filter.query) return;
    previousFilterQueryRef.current = filter.query;

    hasRestoredScrollOffsetRef.current = true;
    actualScrollOffsetRef.current = 0;
    setScrollOffset(0);
    screenPositionHandoff.plan.setScrollY(0);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [filter.query, screenPositionHandoff.plan, setScrollOffset]);

  const rememberScrollOffset = useCallback(
    (event: { nativeEvent: { contentOffset: { y: number } } }) => {
      rememberKeyboardScrollOffset(event);
      actualScrollOffsetRef.current = event.nativeEvent.contentOffset.y;
      screenPositionHandoff.plan.setScrollY(event.nativeEvent.contentOffset.y);
    },
    [rememberKeyboardScrollOffset, screenPositionHandoff.plan],
  );
  const measureSelectedNagger = useCallback(
    (nagger: Nagger, topY: number) => {
      screenPositionHandoff.plan.setScrollY(actualScrollOffsetRef.current);
      screenPositionHandoff.plan.setNaggerTopY(nagger.id, topY);
      if (!hasRestoredScrollOffsetRef.current) {
        setCardContentTopY(topY + actualScrollOffsetRef.current);
      }
    },
    [screenPositionHandoff.plan],
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        style={[styles.list]}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: keyboardInset, paddingTop: topPadding },
        ]}
        data={listItems}
        onContentSizeChange={(_width, height) => setContentHeight(height)}
        initialNumToRender={editorPlacement === null ? 10 : Math.max(10, selectedItemIndex + 1)}
        ListHeaderComponent={<View style={styles.listGap} />}
        ListFooterComponent={
          <View>
            {isDemo && (
              <View>
                <View style={styles.listGap} />
                <DemoDataControls />
              </View>
            )}
            <View style={{ height: bottomComfortSpace }} />
          </View>
        }
        ListEmptyComponent={
          filter.query.trim().length > 0 ? (
            <Text style={styles.emptyText}>No matching tasks</Text>
          ) : null
        }
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          if (item.kind === "date-section") {
            return <DateSectionHeader title={item.title} />;
          }
          if (item.kind === "time-section") {
            return <TimeSectionHeader title={item.title} rangeLabel={item.rangeLabel} />;
          }

          if (item.kind === "holiday") {
            return <Text style={styles.holidayText}>🇩🇰 {item.holiday.name}</Text>;
          }

          const onMeasured =
            item.nagger.id === selectedNaggerId
              ? (topY: number) => measureSelectedNagger(item.nagger, topY)
              : undefined;

          return (
            <Components.FlatList.FlatListTrackedElement onMeasured={onMeasured}>
              <NagCard nagger={item.nagger} />
            </Components.FlatList.FlatListTrackedElement>
          );
        }}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={styles.listGap} />}
        onScroll={rememberScrollOffset}
        scrollEventThrottle={16}
      />
      {filter.isVisible && (
        <PlanFilterBar
          query={filter.query}
          focusRequest={filter.focusRequest}
          onChangeText={filter.setQuery}
          onFocusChange={filter.setIsInputFocused}
          onClose={filter.close}
        />
      )}
    </View>
  );
};

export const NagList = memo(NagListComponent);

const styles = StyleSheet.create({
  holidayText: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    color: nagPlanTheme.nagger.titleText,
    fontSize: 15,
    fontWeight: "700",
  },
  emptyText: { padding: 24, textAlign: "center", color: nagPlanTheme.nagger.titleText },
  container: {
    backgroundColor: nagPlanTheme.screen.background,
    flex: 1,
  },
  list: {
    backgroundColor: nagPlanTheme.screen.background,
  },
  listContent: {
    backgroundColor: nagPlanTheme.screen.background,
    flexGrow: 1,
    paddingHorizontal: nagPlanTheme.screenDensity.horizontalPadding,
  },
  listGap: {
    height: nagPlanTheme.spacing.listGap,
  },
});
