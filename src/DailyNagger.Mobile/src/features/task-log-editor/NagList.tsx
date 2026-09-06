import { FlatList, StyleSheet, useWindowDimensions, View } from "react-native";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useScreenPositionHandoff } from "@/app-shell";
import type { Nagger } from "@/models";
import * as Input from "@/components/input";
import { NagCard } from "./cards";
import { nagPlanTheme } from "./theme";

type NagListProps = {
  readonly nags: readonly Nagger[];
};

export const NagList = ({ nags }: NagListProps) => {
  const screenPositionHandoff = useScreenPositionHandoff();
  const listRef = useRef<FlatList<Nagger>>(null);
  const naggerRef = useRef<View>(null);
  const hasRestoredInitialPositionRef = useRef(false);
  const scrollOffsetRef = useRef(0);
  const { height: screenHeight } = useWindowDimensions();
  const bottomComfortSpace = screenHeight;
  const nagger = nags[0];
  const editorPlacement = useMemo(
    () => (nagger === undefined ? null : screenPositionHandoff.readEditorPlacement(nagger.id)),
    [nagger, screenPositionHandoff],
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

  const measureNaggerTop = useCallback(() => {
    if (nagger === undefined) return;

    naggerRef.current?.measureInWindow((_x, y) => {
      screenPositionHandoff.editor.setNaggerTopY(nagger.id, y);
    });
  }, [nagger, screenPositionHandoff.editor]);
  const rememberEditorScrollOffset = useCallback(
    (event: { nativeEvent: { contentOffset: { y: number } } }) => {
      rememberScrollOffset(event);
      screenPositionHandoff.editor.setScrollY(event.nativeEvent.contentOffset.y);
      measureNaggerTop();
    },
    [measureNaggerTop, rememberScrollOffset, screenPositionHandoff.editor],
  );
  const measureNaggerOnLayout = useCallback(
    (nagger: Nagger) => {
      naggerRef.current?.measureInWindow((_x, topY) => {
        screenPositionHandoff.editor.setNaggerTopY(nagger.id, topY);
      });
    },
    [screenPositionHandoff.editor],
  );
  useEffect(() => {
    if (editorPlacement === null) return;
    if (hasRestoredInitialPositionRef.current) return;

    hasRestoredInitialPositionRef.current = true;
    screenPositionHandoff.markEditorPlacementApplied(editorPlacement);

    if (editorPlacement.initialScrollY <= 0) return;

    scrollOffsetRef.current = editorPlacement.initialScrollY;
    screenPositionHandoff.editor.setScrollY(editorPlacement.initialScrollY);

    const animationFrame = requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({
        animated: false,
        offset: editorPlacement.initialScrollY,
      });
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [editorPlacement, screenPositionHandoff]);

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
          editorPlacement === null || editorPlacement.topFillerHeight <= 0 ? null : (
            <View style={{ height: editorPlacement.topFillerHeight }} />
          )
        }
        ListFooterComponent={<View style={{ height: bottomComfortSpace }} />}
        renderItem={({ item }) => (
          <View ref={naggerRef} collapsable={false} onLayout={() => measureNaggerOnLayout(item)}>
            <NagCard nagger={item} />
          </View>
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
