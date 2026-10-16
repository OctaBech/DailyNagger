import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Keyboard, type KeyboardEvent, type TextInput } from "react-native";
import { appLayout } from "@/config/appLayout";
import { appMotion } from "@/config/appMotion";

type SheetInputFocus = {
  readonly focusInput: (input: TextInput) => void;
  readonly blurInput: (input: TextInput) => void;
  readonly refreshInput: (input: TextInput) => void;
};

export const SheetInputFocusContext = createContext<SheetInputFocus | null>(null);

export function useSheetKeyboardLift(visible: boolean) {
  const [animation] = useState(() => new Animated.Value(0));
  const focusedInput = useRef<TextInput | null>(null);
  const keyboardTopY = useRef<number | null>(null);
  const isOpen = useRef(false);
  const measurementVersion = useRef(0);
  const invalidateMeasurements = useCallback(() => {
    measurementVersion.current++;
  }, []);

  const animateTo = useCallback(
    (value: number) => {
      Animated.timing(animation, {
        duration: appMotion.sheetModal.keyboardSheetLiftDurationMs,
        toValue: value,
        useNativeDriver: true,
      }).start();
    },
    [animation],
  );

  const updateLift = useCallback(() => {
    const input = focusedInput.current;
    const keyboardTop = keyboardTopY.current;
    if (!visible || !isOpen.current || input === null || keyboardTop === null) return;

    const version = ++measurementVersion.current;
    // Freeze the current transform while measuring, so it is removed exactly once.
    animation.stopAnimation((currentTranslateY) => {
      input.measureInWindow((_x, topY, _width, height) => {
        if (version !== measurementVersion.current || focusedInput.current !== input || height <= 0)
          return;
        const unliftedBottomY = topY + height - currentTranslateY;
        const overlap = unliftedBottomY + appLayout.sheetModal.keyboardInputGap - keyboardTop;
        animateTo(-Math.max(0, overlap));
      });
    });
  }, [animateTo, animation, visible]);

  const inputFocus = useMemo<SheetInputFocus>(
    () => ({
      focusInput: (input) => {
        focusedInput.current = input;
        updateLift();
      },
      blurInput: (input) => {
        if (focusedInput.current !== input) return;
        focusedInput.current = null;
        invalidateMeasurements();
      },
      refreshInput: (input) => {
        if (focusedInput.current === input) updateLift();
      },
    }),
    [invalidateMeasurements, updateLift],
  );

  const onOpened = useCallback(() => {
    isOpen.current = true;
    keyboardTopY.current = Keyboard.metrics()?.screenY ?? keyboardTopY.current;
    updateLift();
  }, [updateLift]);

  useEffect(() => {
    if (!visible) return;
    isOpen.current = false;
    animation.setValue(0);
    keyboardTopY.current = Keyboard.metrics()?.screenY ?? null;

    const showKeyboard = (event: KeyboardEvent) => {
      keyboardTopY.current = event.endCoordinates.screenY;
      updateLift();
    };
    const show = Keyboard.addListener("keyboardDidShow", showKeyboard);
    const frame = Keyboard.addListener("keyboardDidChangeFrame", showKeyboard);
    const hide = Keyboard.addListener("keyboardDidHide", () => {
      keyboardTopY.current = null;
      invalidateMeasurements();
      animateTo(0);
    });
    return () => {
      show.remove();
      frame.remove();
      hide.remove();
      isOpen.current = false;
      focusedInput.current = null;
      keyboardTopY.current = null;
      invalidateMeasurements();
      animation.stopAnimation();
    };
  }, [animateTo, animation, invalidateMeasurements, updateLift, visible]);

  return { animation, inputFocus, onOpened };
}
