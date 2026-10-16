import { useCallback, useEffect, useRef, type RefObject } from "react";
import type { View, FlatList, NativeScrollEvent, NativeSyntheticEvent } from "react-native";

type ScrollEvent = NativeSyntheticEvent<NativeScrollEvent>;

export function useKeepTrackedElementVisible<T>({
  listRef,
  enabled,
}: {
  readonly listRef: RefObject<FlatList<T> | null>;
  readonly enabled: boolean;
}) {
  const viewportRef = useRef<View>(null);
  const viewport = useRef({ topY: 0, height: 0 });
  const element = useRef<{ contentTopY: number; height: number } | null>(null);
  const scrollY = useRef(0);
  const contentHeight = useRef(0);
  const isScrolling = useRef(false);

  const keepVisible = useCallback(() => {
    const measured = element.current;
    if (
      !enabled ||
      isScrolling.current ||
      measured === null ||
      measured.height <= 0 ||
      viewport.current.height <= 0 ||
      contentHeight.current <= 0
    )
      return;

    const relativeTopY = measured.contentTopY - scrollY.current - viewport.current.topY;
    const entirelyOutside =
      relativeTopY + measured.height <= 0 || relativeTopY >= viewport.current.height;
    if (!entirelyOutside) return;

    const desiredOffset = scrollY.current + relativeTopY;
    const maxOffset = Math.max(0, contentHeight.current - viewport.current.height);
    const offset = Math.min(maxOffset, Math.max(0, desiredOffset));
    if (Math.abs(offset - scrollY.current) < 1 || listRef.current === null) return;

    isScrolling.current = true;
    listRef.current.scrollToOffset({ offset, animated: true });
  }, [enabled, listRef]);

  useEffect(keepVisible, [keepVisible]);

  const onViewportLayout = useCallback(() => {
    viewportRef.current?.measureInWindow((_x, topY, _width, height) => {
      viewport.current = { topY, height };
      keepVisible();
    });
  }, [keepVisible]);

  const onMeasured = useCallback(
    (topY: number, height: number) => {
      element.current = { contentTopY: topY + scrollY.current, height };
      keepVisible();
    },
    [keepVisible],
  );

  const onContentSizeChange = useCallback(
    (_width: number, height: number) => {
      contentHeight.current = height;
      keepVisible();
    },
    [keepVisible],
  );

  const onScroll = useCallback(
    (event: ScrollEvent) => {
      scrollY.current = event.nativeEvent.contentOffset.y;
      keepVisible();
    },
    [keepVisible],
  );

  const onScrollBegin = useCallback(() => {
    isScrolling.current = true;
  }, []);

  const onScrollEnd = useCallback(
    (event: ScrollEvent) => {
      scrollY.current = event.nativeEvent.contentOffset.y;
      isScrolling.current = false;
      keepVisible();
    },
    [keepVisible],
  );

  const onScrollEndDrag = useCallback(
    (event: ScrollEvent) => {
      // A released finger can still leave the list gliding; wait for momentum end.
      if ((event.nativeEvent.velocity?.y ?? 0) !== 0) return;
      onScrollEnd(event);
    },
    [onScrollEnd],
  );

  return {
    viewportRef,
    onViewportLayout,
    onMeasured,
    onContentSizeChange,
    onScroll,
    onScrollBeginDrag: onScrollBegin,
    onMomentumScrollBegin: onScrollBegin,
    onScrollEndDrag,
    onMomentumScrollEnd: onScrollEnd,
  };
}
