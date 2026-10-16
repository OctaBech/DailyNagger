import {
  FlatList,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useScreenPositionHandoff } from "@/app-shell";
import type { Nagger } from "@/models";
import * as Components from "@/components";
import * as Input from "@/components/input";
import { NagCard } from "./cards";
import { nagPlanTheme } from "./theme";

type NagListProps = {
  readonly nags: readonly Nagger[];
};

export const NagList = ({ nags }: NagListProps) => {
  const screenPositionHandoff = useScreenPositionHandoff();
  const listRef = useRef<FlatList<Nagger>>(null);
  const hasRestoredInitialPositionRef = useRef(false);
  const scrollOffsetRef = useRef(0);
  const [positionRestored, setPositionRestored] = useState(false);
  const nagger = nags[0];
  const naggerId = nagger?.id;
  const editorPlacement = useMemo(
    () => (naggerId === undefined ? null : screenPositionHandoff.readEditorPlacement(naggerId)),
    [naggerId, screenPositionHandoff],
  );
  const positionSpacer = Components.FlatList.useFlatListPositionSpacer(
    editorPlacement?.sourceTopY ?? null,
  );
  const { keyboardInset, rememberScrollOffset } = Input.useKeyboardFocusedInputScroller({
    getScrollOffset: () => scrollOffsetRef.current,
    listRef,
    setScrollOffset: (offset) => {
      scrollOffsetRef.current = offset;
    },
  });
  const {
    viewportRef,
    onViewportLayout,
    onMeasured: measureVisibility,
    onContentSizeChange,
    onScroll: rememberVisibilityScroll,
    onScrollBeginDrag,
    onScrollEndDrag,
    onMomentumScrollBegin,
    onMomentumScrollEnd,
  } = Components.FlatList.useKeepTrackedElementVisible({
    listRef,
    enabled: positionRestored && keyboardInset === 0,
  });
  useEffect(() => {
    hasRestoredInitialPositionRef.current = false;
  }, [nagger?.id]);

  const rememberEditorScrollOffset = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      rememberScrollOffset(event);
      screenPositionHandoff.editor.setScrollY(event.nativeEvent.contentOffset.y);
      rememberVisibilityScroll(event);
    },
    [rememberScrollOffset, screenPositionHandoff.editor, rememberVisibilityScroll],
  );
  const measureNagger = useCallback(
    (nagger: Nagger, topY: number, height: number) => {
      screenPositionHandoff.editor.setNaggerTopY(nagger.id, topY);
      measureVisibility(topY, height);
    },
    [screenPositionHandoff.editor, measureVisibility],
  );
  useEffect(() => {
    if (hasRestoredInitialPositionRef.current) return;

    hasRestoredInitialPositionRef.current = true;
    if (editorPlacement !== null) screenPositionHandoff.markEditorPlacementApplied(editorPlacement);

    scrollOffsetRef.current = positionSpacer.initialScrollY;
    screenPositionHandoff.editor.setScrollY(positionSpacer.initialScrollY);

    const animationFrame = requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({
        animated: false,
        offset: positionSpacer.initialScrollY,
      });
      setPositionRestored(true);
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [editorPlacement, positionSpacer.initialScrollY, screenPositionHandoff]);

  return (
    <View ref={viewportRef} onLayout={onViewportLayout} style={styles.container}>
      <FlatList
        ref={listRef}
        style={[styles.list]}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingBottom: keyboardInset,
          },
        ]}
        data={nags}
        onContentSizeChange={onContentSizeChange}
        ListHeaderComponent={
          positionSpacer.headerHeight <= 0 ? null : (
            <View style={{ height: positionSpacer.headerHeight }} />
          )
        }
        ListFooterComponent={<View style={{ height: positionSpacer.footerHeight }} />}
        renderItem={({ item }) => (
          <Components.FlatList.FlatListTrackedElement
            onMeasured={(topY, height) => measureNagger(item, topY, height)}
          >
            <NagCard nagger={item} />
          </Components.FlatList.FlatListTrackedElement>
        )}
        keyExtractor={(nagger: Nagger) => nagger.id}
        ItemSeparatorComponent={() => <View style={styles.listGap} />}
        onScroll={rememberEditorScrollOffset}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        onMomentumScrollBegin={onMomentumScrollBegin}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
      />
    </View>
  );
};

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
