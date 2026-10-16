import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { renderHook } from "@testing-library/react-native";
import { Animated, Keyboard, type KeyboardEvent, type TextInput } from "react-native";
import { useSheetKeyboardLift } from "@/components/modal/useSheetKeyboardLift";

const listeners = new Map<string, (event: KeyboardEvent) => void>();
let translateY = 0;

function keyboardEvent(topY: number) {
  return { endCoordinates: { screenY: topY, height: 300 } } as KeyboardEvent;
}

function inputWithBottom(bottomY: number): TextInput {
  return {
    measureInWindow: (callback: (x: number, y: number, width: number, height: number) => void) =>
      callback(0, bottomY - 40 + translateY, 200, 40),
  } as unknown as TextInput;
}

beforeEach(() => {
  translateY = 0;
  listeners.clear();
  jest.spyOn(Keyboard, "metrics").mockReturnValue(undefined);
  jest.spyOn(Keyboard, "addListener").mockImplementation((name, callback) => {
    listeners.set(name, callback);
    return {
      remove: () => {
        listeners.delete(name);
      },
    } as ReturnType<typeof Keyboard.addListener>;
  });
  jest.spyOn(Animated, "timing").mockImplementation((value, config) => ({
    start: () => {
      translateY = config.toValue as number;
      (value as Animated.Value).setValue(translateY);
    },
    stop: jest.fn(),
    reset: jest.fn(),
  }));
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("focused sheet keyboard lift", () => {
  it("lifts by the focused input overlap plus the gap, without accumulating lift", async () => {
    const { result } = await renderHook(() => useSheetKeyboardLift(true));
    result.current.onOpened();
    result.current.inputFocus.focusInput(inputWithBottom(700));
    listeners.get("keyboardDidShow")!(keyboardEvent(500));
    expect(translateY).toBe(-212);

    listeners.get("keyboardDidChangeFrame")!(keyboardEvent(500));
    expect(translateY).toBe(-212);
  });

  it("does not lift an input that already has room above the keyboard", async () => {
    const { result } = await renderHook(() => useSheetKeyboardLift(true));
    result.current.onOpened();
    result.current.inputFocus.focusInput(inputWithBottom(400));
    listeners.get("keyboardDidShow")!(keyboardEvent(500));

    expect(Math.abs(translateY)).toBe(0);
  });

  it("updates on focus changes while the keyboard stays open", async () => {
    const { result } = await renderHook(() => useSheetKeyboardLift(true));
    result.current.onOpened();
    result.current.inputFocus.focusInput(inputWithBottom(700));
    listeners.get("keyboardDidShow")!(keyboardEvent(500));
    result.current.inputFocus.focusInput(inputWithBottom(550));

    expect(translateY).toBe(-62);
    listeners.get("keyboardDidHide")!(keyboardEvent(800));
    expect(translateY).toBe(0);
  });

  it("waits until the opening animation finishes before measuring lift", async () => {
    const { result } = await renderHook(() => useSheetKeyboardLift(true));
    result.current.inputFocus.focusInput(inputWithBottom(700));
    listeners.get("keyboardDidShow")!(keyboardEvent(500));
    expect(translateY).toBe(0);

    result.current.onOpened();
    expect(translateY).toBe(-212);
  });

  it("does not lift when the modal has no focused input", async () => {
    const { result, unmount } = await renderHook(() => useSheetKeyboardLift(true));
    result.current.onOpened();
    listeners.get("keyboardDidShow")!(keyboardEvent(500));
    expect(Animated.timing).not.toHaveBeenCalled();

    await unmount();
    expect(listeners.size).toBe(0);
  });
});
