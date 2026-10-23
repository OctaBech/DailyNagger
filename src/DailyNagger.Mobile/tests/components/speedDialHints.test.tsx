import type * as ReactNative from "react-native";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render } from "@testing-library/react-native";
import { SpeedDial } from "@/components/speed-dial/SpeedDial";
import { appTiming } from "@/config/appTiming";

jest.mock("@/config", () => ({
  ...jest.requireActual<object>("@/config/appTiming"),
  ...jest.requireActual<object>("@/config/appLayout"),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock("react-native-paper", () => {
  const { Pressable } = jest.requireActual<typeof ReactNative>("react-native");
  return {
    Portal: ({ children }: { children: ReactNode }) => children,
    FAB: ({
      icon,
      onPress,
      disabled,
    }: {
      icon: string;
      onPress: () => void;
      disabled?: boolean;
    }) => <Pressable accessibilityLabel={icon} onPress={onPress} disabled={disabled} />,
  };
});

afterEach(() => {
  jest.useRealTimers();
});

describe("speed dial hesitation hints", () => {
  it("restarts the delay on an option press and clears hints across close/reopen", async () => {
    jest.useFakeTimers();
    const onSelect = jest.fn();
    const screen = await render(
      <SpeedDial
        menu={{
          items: [
            {
              key: "undo",
              label: "Undo hint",
              iconType: "vector",
              iconValue: "undo",
              showLabel: true,
              keepOpenAfterPress: true,
              onSelect,
            },
          ],
        }}
      />,
    );
    await fireEvent.press(screen.getByLabelText("plus"));
    await act(() => jest.advanceTimersByTime(appTiming.speedDial.hesitationAssistDelayMs - 1));
    expect(screen.queryByText("Undo hint")).toBeNull();
    await fireEvent.press(screen.getByLabelText("undo"));
    expect(onSelect).toHaveBeenCalledTimes(1);
    await act(() => jest.advanceTimersByTime(appTiming.speedDial.hesitationAssistDelayMs - 1));
    expect(screen.queryByText("Undo hint")).toBeNull();
    await act(() => jest.advanceTimersByTime(1));
    expect(screen.getByText("Undo hint")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("undo"));
    expect(screen.queryByText("Undo hint")).toBeNull();
    await fireEvent.press(screen.getByLabelText("close"));
    await act(() => jest.advanceTimersByTime(appTiming.speedDial.hesitationAssistDelayMs));
    await fireEvent.press(screen.getByLabelText("plus"));
    expect(screen.queryByText("Undo hint")).toBeNull();
    await act(() => jest.advanceTimersByTime(appTiming.speedDial.hesitationAssistDelayMs));
    expect(screen.getByText("Undo hint")).toBeTruthy();
    await screen.unmount();
  });
});
