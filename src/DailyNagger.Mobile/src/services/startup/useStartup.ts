import type { StateScreenProps } from "@/components/primitives";
import {
  runWithMiddleware,
  type MiddlewareExecutionContext,
  type MiddlewareWrapperFunction,
} from "@/middleware";
import { useRefLatestValue } from "@/shared";
import { useCallback, useEffect, useReducer, useRef } from "react";
import type { Loading } from "../loading";
import type { Rollover } from "../rollover";
import type { Sending } from "../sending";
import type { StartupEvents } from "./events";
import {
  blockStartupBecauseServerIsUnavailable,
  flushQueue,
  runStartupStep,
} from "./startupExecution";
import { initialStartupState, startupReducer } from "./startupState";
import { createStartupStateScreenContent } from "./startupStateScreen";

export type Startup = ReturnType<typeof useStartup>;

export function useStartup(
  sending: Sending,
  loading: Loading,
  rollover: Rollover,
  middlewareWrapperFunction: MiddlewareWrapperFunction,
  startupEvents: StartupEvents,
) {
  const isRunningRef = useRef(false);
  const sendingRef = useRefLatestValue(sending);
  const loadingRef = useRefLatestValue(loading);
  const rolloverRef = useRefLatestValue(rollover);
  const [state, dispatch] = useReducer(startupReducer, initialStartupState);

  const runStartupRunbook = useCallback(
    async (context: MiddlewareExecutionContext): Promise<void> => {
      startupEvents.emit("startup.started", context);

      // 1. Send any saved local updates before loading fresh server state.
      if (
        (await runStartupStep(startupEvents, context, "flush-before-load", () =>
          flushQueue(sendingRef.current),
        )) === false
      ) {
        blockStartupBecauseServerIsUnavailable(startupEvents, context, dispatch);
        return;
      }

      // 2. Load the current plan from the server.
      const loadResult = await runStartupStep(startupEvents, context, "load-plan", () =>
        loadingRef.current.loadPlan(),
      );

      // 3. Stop startup if loading needs a user-facing recovery screen.
      if (loadResult.kind === "blocked") {
        dispatch({
          type: "plan-load-blocked",
          stateScreenProps: loadResult.stateScreenProps,
        });
        startupEvents.emit("startup.blocked.plan_load", context);
        return;
      }

      // 4. Apply rollover rules after a clean plan load.
      await runStartupStep(startupEvents, context, "rollover", () =>
        rolloverRef.current.rolloverDueNaggers(),
      );

      // 5. Send rollover updates before the app becomes interactive.
      if (
        (await runStartupStep(startupEvents, context, "flush-after-rollover", () =>
          flushQueue(sendingRef.current),
        )) === false
      ) {
        blockStartupBecauseServerIsUnavailable(startupEvents, context, dispatch);
        return;
      }

      // 6. Startup is complete; screens and actions may now run normally.
      dispatch({ type: "startup-succeeded" });
      startupEvents.emit("startup.ready", context);
    },
    [loadingRef, rolloverRef, sendingRef, startupEvents],
  );

  const bootstrapStartup = useCallback(async (): Promise<void> => {
    if (isRunningRef.current) return;

    isRunningRef.current = true;
    dispatch({ type: "startup-started" });

    const causalityKey = `startup/run:${new Date().toISOString()}`;

    try {
      await runWithMiddleware(causalityKey, runStartupRunbook, middlewareWrapperFunction);
    } catch (error) {
      startupEvents.emit("startup.failed", { causalityKey, error });
      throw error;
    } finally {
      isRunningRef.current = false;
    }
  }, [middlewareWrapperFunction, runStartupRunbook, startupEvents]);

  const start = useCallback((): void => {
    if (state.status !== "not-started") return;

    void bootstrapStartup();
  }, [bootstrapStartup, state.status]);

  const retry = useCallback((): void => {
    if (state.status !== "blocked") return;

    void bootstrapStartup();
  }, [bootstrapStartup, state.status]);

  useEffect(() => {
    start();
  }, [start]);

  const stateScreenContent = createStartupStateScreenContent(state);
  const stateScreenProps: StateScreenProps | null =
    stateScreenContent === null
      ? null
      : {
          ...stateScreenContent,
          primaryAction: {
            label: stateScreenContent.primaryActionLabel,
            accessibilityLabel: "Try startup again",
            onPress: retry,
          },
        };
  const hasBlockingState = state.blockingState !== null;

  return {
    isReady: state.status === "ready",
    hasBlockingState,
    stateScreenProps,
    startupEvents,
    retry,
  };
}
