import { FlatList, StyleSheet, useWindowDimensions, View } from "react-native";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { useScreenPositionHandoff } from "@/app-shell";
import type { Nagger } from "@/models";
import * as Components from "@/components";
import * as Input from "@/components/input";
import { TimeSectionHeader } from "@/components/primitives";
import { NagCard } from "./cards";
import { nagPlanTheme } from "./theme";
import { buildNagPlanListItems, type NagPlanListItem } from "./buildNagPlanListItems";

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
  const appliedPlanPlacementKeyRef = useRef<string | null>(null);
  const { height: screenHeight } = useWindowDimensions();
  const bottomComfortSpace = screenHeight;
  const listItems = useMemo(() => buildNagPlanListItems(nags), [nags]);
  const selectedNaggerId = useMemo(
    () => nags.find((nagger) => nagger.clientProps.isSelected)?.id ?? null,
    [nags],
  );
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

  const applyPlanPlacement = useCallback(
    (naggerId: Nagger["id"], topY: number) => {
      const placement = screenPositionHandoff.readPlanPlacement(naggerId, topY);
      if (placement === null) return;

      const placementKey = `${placement.naggerId}:${placement.sourceTopY.toFixed(1)}`;
      if (appliedPlanPlacementKeyRef.current === placementKey) return;

      appliedPlanPlacementKeyRef.current = placementKey;
      setScrollOffset(placement.nextScrollY);
      screenPositionHandoff.plan.setScrollY(placement.nextScrollY);
      screenPositionHandoff.markPlanPlacementApplied(placement);
      listRef.current?.scrollToOffset({ animated: false, offset: placement.nextScrollY });
    },
    [screenPositionHandoff, setScrollOffset],
  );
  const rememberScrollOffset = useCallback(
    (event: { nativeEvent: { contentOffset: { y: number } } }) => {
      rememberKeyboardScrollOffset(event);
      screenPositionHandoff.plan.setScrollY(event.nativeEvent.contentOffset.y);
    },
    [rememberKeyboardScrollOffset, screenPositionHandoff.plan],
  );
  const measureSelectedNagger = useCallback(
    (nagger: Nagger, topY: number) => {
      screenPositionHandoff.plan.setNaggerTopY(nagger.id, topY);
      applyPlanPlacement(nagger.id, topY);
    },
    [applyPlanPlacement, screenPositionHandoff.plan],
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
        ListFooterComponent={<View style={{ height: bottomComfortSpace }} />}
        renderItem={({ item }) => {
          if (item.kind === "time-section") {
            return <TimeSectionHeader title={item.title} rangeLabel={item.rangeLabel} />;
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
    </View>
  );
};

export const NagList = memo(NagListComponent);

const styles = StyleSheet.create({
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
