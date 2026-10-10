import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { renderHook } from "@testing-library/react-native";
import { runWithoutMiddleware } from "@/middleware";
import { registerAction } from "@/services/action-boundary/register/actionRegistrationModel";
import { useActionBoundary } from "@/services/action-boundary/useActionBoundary";
import { useRef } from "react";
import type { MiddlewareExecutionContext } from "@/middleware";
import { useEventEmitter } from "@/shared/useEventEmitter";
import type { ActionExecutionEventType, ActionExecutionEvent } from "@/services/action-boundary";

import type {
  RuntimeDependencyInputs,
  RuntimeDependenciesForActionScope,
} from "@/services/action-boundary/action-dependencies";
import type { Memory } from "@/services/contracts";

afterEach(() => {
  jest.restoreAllMocks();
});

describe("useActionBoundary", () => {
  it("keeps the generated action reference and uses the latest memory after rerender", async () => {
    const firstMemory = { name: "first" } as unknown as Memory;
    const latestMemory = { name: "latest" } as unknown as Memory;
    let memoryUsedByAction: Memory | undefined;
    let valueReceivedByAction: string | undefined;
    let argumentsReceivedByAction: { value: string } | undefined;

    const registry = {
      example: {
        run: registerAction(
          (
            args: { value: string },
            dependencies: RuntimeDependenciesForActionScope<"plan/navigation">,
          ) => {
            valueReceivedByAction = args.value;
            argumentsReceivedByAction = args;
            memoryUsedByAction = dependencies.memory;
          },
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

    const actionSequenceRef = { current: 0 };
    const renderedActions = await renderHook(
      (planMemory: Memory) =>
        useActionBoundary(registry, {
          ...otherInputs,
          registryName: "plan-screen",
          actionSequenceRef,
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

    const actionArguments = { value: "coffee" };
    firstActionReference(actionArguments);

    expect(argumentsReceivedByAction).toBe(actionArguments);
    expect(valueReceivedByAction).toBe("coffee");
    expect(memoryUsedByAction).toBe(latestMemory);
  });

  it("shares the start sequence across screens and menus, including same-millisecond calls and wrapper failures", async () => {
    jest.spyOn(Date.prototype, "toISOString").mockReturnValue("2026-10-11T00:14:03.127Z");
    const contexts: MiddlewareExecutionContext[] = [];

    const registry = {
      example: {
        run: registerAction(
          (
            _args: Record<string, never>,
            _services: RuntimeDependenciesForActionScope<"plan/navigation">,
          ) => {},
          "plan/navigation",
        ),
      },
    } as const;
    const inputs = {
      cultureSettings: {},
      editorMemory: {},
      planInteractionStamp: {},
      planMemory: {},
      sending: {},
    } as RuntimeDependencyInputs;
    let failBeforeAction = false;
    const { result, rerender } = await renderHook(() => {
      const actionSequenceRef = useRef(0);
      const actionEvents = useEventEmitter<ActionExecutionEventType, ActionExecutionEvent>();
      const props = {
        ...inputs,
        actionSequenceRef,
        middlewareWrapperFunction: <TResult,>(
          context: MiddlewareExecutionContext,
          run: () => TResult,
        ): TResult => {
          contexts.push(context);
          if (failBeforeAction) throw new Error("wrapper failed");
          return run();
        },
        actionEvents,
      };
      return {
        sequenceRef: actionSequenceRef,
        events: actionEvents,
        screen: useActionBoundary(registry, { ...props, registryName: "plan-screen" }),
        menu: useActionBoundary(registry, { ...props, registryName: "plan-menu" }),
      };
    });
    const firstSequenceRef = result.current.sequenceRef;
    result.current.screen.example.run({});
    result.current.menu.example.run({});
    await rerender(undefined);
    expect(result.current.sequenceRef).toBe(firstSequenceRef);
    result.current.screen.example.run({});
    const emit = jest.spyOn(result.current.events, "emit");
    failBeforeAction = true;
    expect(() => result.current.menu.example.run({})).toThrow("wrapper failed");
    expect(contexts.map((context) => context.causalityKey)).toEqual([
      "action:1|name:plan-screen/example/run|time:2026-10-11T00:14:03.127Z",
      "action:2|name:plan-menu/example/run|time:2026-10-11T00:14:03.127Z",
      "action:3|name:plan-screen/example/run|time:2026-10-11T00:14:03.127Z",
      "action:4|name:plan-menu/example/run|time:2026-10-11T00:14:03.127Z",
    ]);
    expect(emit).toHaveBeenCalledWith(
      "action-failed",
      expect.objectContaining({ causalityKey: contexts[3].causalityKey }),
    );
  });
});
