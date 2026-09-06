import { FlatList, StyleSheet, View } from "react-native";
import { useCallback, useEffect, useMemo, useRef } from "react";
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
  const nagger = nags[0];
  const editorPlacement = useMemo(
    () => (nagger === undefined ? null : screenPositionHandoff.readEditorPlacement(nagger.id)),
    [nagger, screenPositionHandoff],
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
  useEffect(() => {
    hasRestoredInitialPositionRef.current = false;
  }, [nagger?.id]);

  const rememberEditorScrollOffset = useCallback(
    (event: { nativeEvent: { contentOffset: { y: number } } }) => {
      rememberScrollOffset(event);
      screenPositionHandoff.editor.setScrollY(event.nativeEvent.contentOffset.y);
    },
    [rememberScrollOffset, screenPositionHandoff.editor],
  );
  const measureNagger = useCallback(
    (nagger: Nagger, topY: number) => {
      screenPositionHandoff.editor.setNaggerTopY(nagger.id, topY);
    },
    [screenPositionHandoff.editor],
  );
  useEffect(() => {
    if (editorPlacement === null) return;
    if (hasRestoredInitialPositionRef.current) return;

    hasRestoredInitialPositionRef.current = true;
    screenPositionHandoff.markEditorPlacementApplied(editorPlacement);

    if (positionSpacer.initialScrollY <= 0) return;

    scrollOffsetRef.current = positionSpacer.initialScrollY;
    screenPositionHandoff.editor.setScrollY(positionSpacer.initialScrollY);

    const animationFrame = requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({
        animated: false,
        offset: positionSpacer.initialScrollY,
      });
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [editorPlacement, positionSpacer.initialScrollY, screenPositionHandoff]);

  return (
    <View style={styles.container}>
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
        ListHeaderComponent={
          positionSpacer.headerHeight <= 0 ? null : (
            <View style={{ height: positionSpacer.headerHeight }} />
          )
        }
        ListFooterComponent={<View style={{ height: positionSpacer.footerHeight }} />}
        renderItem={({ item }) => (
          <Components.FlatList.FlatListTrackedElement
            onMeasured={(topY) => measureNagger(item, topY)}
          >
            <NagCard nagger={item} />
          </Components.FlatList.FlatListTrackedElement>
        )}
        keyExtractor={(nagger: Nagger) => nagger.id}
        ItemSeparatorComponent={() => <View style={styles.listGap} />}
        onScroll={rememberEditorScrollOffset}
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
