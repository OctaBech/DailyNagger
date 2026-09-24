import { describe, expect, it } from "@jest/globals";
import { renderHook } from "@testing-library/react-native";
import { runWithoutMiddleware } from "@/middleware";
import { registerAction } from "@/services/action-boundary/register/actionRegistrationModel";
import { useActionBoundary } from "@/services/action-boundary/useActionBoundary";
import type {
  RuntimeDependencyInputs,
  RuntimeDependenciesForActionScope,
} from "@/services/action-boundary/action-dependencies";
import type { Memory } from "@/services/contracts";

describe("useActionBoundary", () => {
  it("keeps the generated action reference and uses the latest memory after rerender", async () => {
    const firstMemory = { name: "first" } as unknown as Memory;
    const latestMemory = { name: "latest" } as unknown as Memory;
    let memoryUsedByAction: Memory | undefined;
    let valueReceivedByAction: string | undefined;

    const registry = {
      example: {
        run: registerAction(
          (
            args: { value: string },
            dependencies: RuntimeDependenciesForActionScope<"plan/navigation">,
          ) => {
            valueReceivedByAction = args.value;
            memoryUsedByAction = dependencies.memory;
          },
          (value: string) => ({ value }),
          "plan/navigation",
        ),
      },
    } as const;

    // The navigation action only reads planMemory; the other inputs fill the boundary contract.
    const otherInputs = {
      cultureSettings: {},
      editorMemory: {},
      planInteractionStamp: {},
      sending: {},
    } as Omit<RuntimeDependencyInputs, "planMemory">;

    const renderedActions = await renderHook(
      (planMemory: Memory) =>
        useActionBoundary(registry, {
          ...otherInputs,
          planMemory,
          middlewareWrapperFunction: runWithoutMiddleware,
        }),
      { initialProps: firstMemory },
    );

    const firstActionPack = renderedActions.result.current;
    const firstActionReference = firstActionPack.example.run;

    await renderedActions.rerender(latestMemory);

    expect(renderedActions.result.current).toBe(firstActionPack);
    expect(renderedActions.result.current.example.run).toBe(firstActionReference);

    firstActionReference("coffee");

    expect(valueReceivedByAction).toBe("coffee");
    expect(memoryUsedByAction).toBe(latestMemory);
  });
});
