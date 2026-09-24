import { renderHook } from "@testing-library/react-native";
import { describe, expect, it } from "@jest/globals";
import { useStableCallback } from "@/shared/useStableCallback";

describe("useStableCallback", () => {
  it("keeps the same reference and calls the latest function after rerender", async () => {
    const readOriginalValue = () => "original";
    const readUpdatedValue = () => "updated";

    const renderedStableCallback = await renderHook(
      (readValue: () => string) => useStableCallback(readValue),
      { initialProps: readOriginalValue },
    );

    const firstReference = renderedStableCallback.result.current;

    await renderedStableCallback.rerender(readUpdatedValue);

    expect(renderedStableCallback.result.current).toBe(firstReference);
    expect(renderedStableCallback.result.current()).toBe("updated");
  });

  it("forwards arguments and the return value", async () => {
    const formatCoffeeOrder = (coffee: string, count: number) => `${count} x ${coffee}`;

    const renderedStableCallback = await renderHook(
      (formatOrder: typeof formatCoffeeOrder) => useStableCallback(formatOrder),
      { initialProps: formatCoffeeOrder },
    );

    const result = renderedStableCallback.result.current("coffee", 2);

    expect(result).toBe("2 x coffee");
  });
});
