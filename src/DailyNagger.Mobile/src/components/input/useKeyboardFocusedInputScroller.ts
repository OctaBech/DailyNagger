import { useModalKeyboardBoundary } from "@/app-shell/modal-keyboard-boundary";
import { useCallback, useEffect, useRef, useState } from "react";
import { Keyboard, TextInput } from "react-native";
import type { FlatList, KeyboardEvent } from "react-native";
import type { RefObject } from "react";

type ScrollOffsetEvent = {
  readonly nativeEvent: {
    readonly contentOffset: {
      readonly y: number;
    };
  };
};

type KeyboardFocusedInputScrollerProps<TItem> = {
  readonly listRef: RefObject<FlatList<TItem> | null>;
  readonly getScrollOffset: () => number;
  readonly setScrollOffset: (offset: number) => void;
};

const keyboardGap = 18;

export function useKeyboardFocusedInputScroller<TItem>({
  getScrollOffset,
  listRef,
  setScrollOffset,
}: KeyboardFocusedInputScrollerProps<TItem>) {
  const { isModalKeyboardBoundaryActive } = useModalKeyboardBoundary();
  const keyboardTopRef = useRef<number | null>(null);
  const scrollOffsetRef = useRef(getScrollOffset());
  const [keyboardInset, setKeyboardInset] = useState(0);

  const scrollFocusedInputIntoView = useCallback(() => {
    if (isModalKeyboardBoundaryActive) return;

    const keyboardTop = keyboardTopRef.current;
    if (keyboardTop === null) return;

    const focusedInput = TextInput.State.currentlyFocusedInput();
    if (focusedInput === null) return;

    focusedInput.measure((_x, _y, _width, height, _pageX, pageY) => {
      const overlap = pageY + height + keyboardGap - keyboardTop;
      if (overlap <= 0) return;

      const nextOffset = Math.max(0, scrollOffsetRef.current + overlap);
      scrollOffsetRef.current = nextOffset;
      setScrollOffset(nextOffset);
      listRef.current?.scrollToOffset({ animated: true, offset: nextOffset });
    });
  }, [isModalKeyboardBoundaryActive, listRef, setScrollOffset]);

  useEffect(() => {
    function setKeyboardFrame(event: KeyboardEvent) {
      keyboardTopRef.current = event.endCoordinates.screenY;
      setKeyboardInset(event.endCoordinates.height + keyboardGap);
      requestAnimationFrame(scrollFocusedInputIntoView);
    }

    const showSubscription = Keyboard.addListener("keyboardDidShow", setKeyboardFrame);
    const frameSubscription = Keyboard.addListener("keyboardDidChangeFrame", setKeyboardFrame);
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      keyboardTopRef.current = null;
      setKeyboardInset(0);
    });

    return () => {
      showSubscription.remove();
      frameSubscription.remove();
      hideSubscription.remove();
    };
  }, [scrollFocusedInputIntoView]);

  const rememberScrollOffset = useCallback(
    (event: ScrollOffsetEvent) => {
      const nextOffset = event.nativeEvent.contentOffset.y;
      scrollOffsetRef.current = nextOffset;
      setScrollOffset(nextOffset);
    },
    [setScrollOffset],
  );

  return {
    keyboardInset,
    rememberScrollOffset,
    scrollFocusedInputIntoView,
  } as const;
}
