import { describe, expect, it } from "@jest/globals";
import { renderHook } from "@testing-library/react-native";
import { useRefLatestValue } from "@/shared/useRefLatestValue";

describe("useRefLatestValue", () => {
  it("returns a ref containing the initial value", async () => {
    const { result: hookResult } = await renderHook(useRefLatestValue<string>, {
      initialProps: "coffee",
    });

    const valueRef = hookResult.current;

    expect(valueRef.current).toBe("coffee");
  });

  it("returns the same ref object and updates its current value after rerender", async () => {
    const { result: hookResult, rerender } = await renderHook(useRefLatestValue<string>, {
      initialProps: "original",
    });

    const refBeforeRerender = hookResult.current;

    await rerender("updated");

    const refAfterRerender = hookResult.current;

    expect(refAfterRerender).toBe(refBeforeRerender);
    expect(refAfterRerender.current).toBe("updated");
  });
});
