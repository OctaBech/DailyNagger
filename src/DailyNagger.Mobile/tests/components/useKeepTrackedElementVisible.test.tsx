import { describe, expect, it, jest } from "@jest/globals";
import { renderHook } from "@testing-library/react-native";
import type { FlatList, NativeScrollEvent, NativeSyntheticEvent, View } from "react-native";
import { useKeepTrackedElementVisible } from "@/components/flatlist/useKeepTrackedElementVisible";

function scrollEvent(y: number, velocity = 0) {
  return {
    nativeEvent: { contentOffset: { y }, velocity: { y: velocity } },
  } as NativeSyntheticEvent<NativeScrollEvent>;
}

async function setup() {
  const scrollToOffset = jest.fn();
  const listRef = { current: { scrollToOffset } as unknown as FlatList<unknown> };
  const hook = await renderHook(
    (enabled: boolean) => useKeepTrackedElementVisible({ listRef, enabled }),
    { initialProps: false },
  );
  hook.result.current.viewportRef.current = {
    measureInWindow: (callback: (x: number, y: number, width: number, height: number) => void) =>
      callback(0, 40, 400, 600),
  } as unknown as View;
  hook.result.current.onViewportLayout();
  hook.result.current.onContentSizeChange(400, 2000);
  return { hook, scrollToOffset };
}

describe("useKeepTrackedElementVisible", () => {
  it("animates back when the whole tree is above the viewport", async () => {
    const { hook, scrollToOffset } = await setup();
    hook.result.current.onScroll(scrollEvent(1000));
    hook.result.current.onMeasured(-460, 300);
    await hook.rerender(true);

    expect(scrollToOffset).toHaveBeenCalledWith({ offset: 500, animated: true });
  });

  it("animates to a card below the viewport", async () => {
    const { hook, scrollToOffset } = await setup();
    hook.result.current.onMeasured(940, 300);
    await hook.rerender(true);

    expect(scrollToOffset).toHaveBeenCalledWith({ offset: 900, animated: true });
  });

  it("leaves a negative top alone while some of the tree is still visible", async () => {
    const { hook, scrollToOffset } = await setup();
    hook.result.current.onMeasured(-40, 300);
    await hook.rerender(true);

    expect(scrollToOffset).not.toHaveBeenCalled();
  });

  it("waits for dragging and momentum, and does not restart its own animation", async () => {
    const { hook, scrollToOffset } = await setup();
    hook.result.current.onMeasured(540, 300);
    await hook.rerender(true);
    hook.result.current.onScrollBeginDrag();
    hook.result.current.onScroll(scrollEvent(1000));
    hook.result.current.onScrollEndDrag(scrollEvent(1000, 2));
    hook.result.current.onMomentumScrollBegin();
    expect(scrollToOffset).not.toHaveBeenCalled();

    hook.result.current.onMomentumScrollEnd(scrollEvent(1000));
    hook.result.current.onScroll(scrollEvent(800));
    hook.result.current.onScroll(scrollEvent(600));
    expect(scrollToOffset).toHaveBeenCalledTimes(1);

    hook.result.current.onMomentumScrollEnd(scrollEvent(500));
    expect(scrollToOffset).toHaveBeenCalledTimes(1);
  });

  it("also handles a drag that ends without momentum", async () => {
    const { hook, scrollToOffset } = await setup();
    hook.result.current.onMeasured(540, 300);
    await hook.rerender(true);
    hook.result.current.onScrollBeginDrag();
    hook.result.current.onScroll(scrollEvent(1000));
    hook.result.current.onScrollEndDrag(scrollEvent(1000));

    expect(scrollToOffset).toHaveBeenCalledWith({ offset: 500, animated: true });
  });

  it("does nothing while disabled", async () => {
    const { hook, scrollToOffset } = await setup();
    hook.result.current.onMeasured(940, 300);
    hook.result.current.onMomentumScrollEnd(scrollEvent(0));

    expect(scrollToOffset).not.toHaveBeenCalled();
  });
});
