import { useContext, useEffect, useImperativeHandle, useRef, type ForwardedRef } from "react";
import type { TextInput, TextInputProps } from "react-native";
import { SheetInputFocusContext } from "./useSheetKeyboardLift";

export function useSheetInputFocus(
  forwardedRef: ForwardedRef<TextInput>,
  { onFocus, onBlur, onLayout }: Pick<TextInputProps, "onFocus" | "onBlur" | "onLayout">,
) {
  const boundary = useContext(SheetInputFocusContext);
  const inputRef = useRef<TextInput | null>(null);
  useImperativeHandle(forwardedRef, () => inputRef.current!, []);
  useEffect(() => {
    const input = inputRef.current;
    return () => {
      if (input !== null) boundary?.blurInput(input);
    };
  }, [boundary]);

  return {
    ref: inputRef,
    onFocus: ((event) => {
      if (inputRef.current !== null) boundary?.focusInput(inputRef.current);
      onFocus?.(event);
    }) satisfies NonNullable<TextInputProps["onFocus"]>,
    onBlur: ((event) => {
      if (inputRef.current !== null) boundary?.blurInput(inputRef.current);
      onBlur?.(event);
    }) satisfies NonNullable<TextInputProps["onBlur"]>,
    onLayout: ((event) => {
      if (inputRef.current !== null) boundary?.refreshInput(inputRef.current);
      onLayout?.(event);
    }) satisfies NonNullable<TextInputProps["onLayout"]>,
  };
}
