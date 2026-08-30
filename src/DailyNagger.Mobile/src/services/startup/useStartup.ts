import type { StateScreenProps } from "@/components/primitives";
import { assertNever, useRefLatestValue } from "@/shared";
import type { Dispatch } from "react";
import { useCallback, useEffect, useReducer, useRef } from "react";
import type { Loading } from "../loading";
import type { Rollover } from "../rollover";
import type { Sending } from "../sending";
import { recordStartupOperation, recordStartupStep } from "@/observability";

type StartupState = {
  readonly status: StartupStatus;
  readonly blockingState: StartupBlockingState | null;
};

type StartupStatus = "not-started" | "running" | "blocked" | "ready";

type StartupBlockingState =
  | { readonly kind: "server-unavailable" }
  | { readonly kind: "plan-load-blocked"; readonly stateScreenProps: StateScreenProps };

type StartupEvent =
  | { readonly type: "startup-started" }
  | { readonly type: "server-unreachable" }
  | { readonly type: "plan-load-blocked"; readonly stateScreenProps: StateScreenProps }
  | { readonly type: "startup-succeeded" };

export type Startup = ReturnType<typeof useStartup>;

export function useStartup(sending: Sending, loading: Loading, rollover: Rollover) {
  const isRunningRef = useRef(false);
  const sendingRef = useRefLatestValue(sending);
  const loadingRef = useRefLatestValue(loading);
  const rolloverRef = useRefLatestValue(rollover);

  const [state, dispatch] = useReducer(startupReducer, {
    status: "not-started",
    blockingState: null,
  });

  const runStartup = useCallback(async (): Promise<void> => {
    if (isRunningRef.current) return;

    isRunningRef.current = true;
    dispatch({ type: "startup-started" });
    const observability = recordStartupOperation();

    try {
      if (
        (await recordStartupStep(observability, "flush-before-load", () =>
          flushQueueOrBlockStartup(sendingRef.current, dispatch),
        )) === false
      ) {
        return;
      }

      const loadResult = await recordStartupStep(observability, "load-plan", () =>
        loadingRef.current.loadPlan(),
      );

      if (loadResult.kind === "blocked") {
        dispatch({
          type: "plan-load-blocked",
          stateScreenProps: loadResult.stateScreenProps,
        });
        return;
      }

      await recordStartupStep(observability, "rollover", () =>
        rolloverRef.current.rolloverDueNaggers(),
      );
      if (
        (await recordStartupStep(observability, "flush-after-rollover", () =>
          flushQueueOrBlockStartup(sendingRef.current, dispatch),
        )) === false
      ) {
        return;
      }

      dispatch({ type: "startup-succeeded" });
    } finally {
      isRunningRef.current = false;
    }
  }, [loadingRef, rolloverRef, sendingRef]);

  const start = useCallback((): void => {
    if (state.status !== "not-started") return;

    void runStartup();
  }, [runStartup, state.status]);

  const retry = useCallback((): void => {
    if (state.status !== "blocked") return;

    void runStartup();
  }, [runStartup, state.status]);

  useEffect(() => {
    start();
  }, [start]);

  const sendingConfrontation = sending.serverConfrontation.state;
  let stateScreenProps: StateScreenProps | null = null;

  if (sendingConfrontation !== null) {
    stateScreenProps = createSendingConfrontationStateScreenProps(sending);
  } else if (state.blockingState?.kind === "server-unavailable") {
    stateScreenProps = {
      title: "Server unavailable",
      message:
        "DailyNagger could not connect to the server. Check that the backend is running and try again.",
      primaryAction: {
        label: "Try again",
        accessibilityLabel: "Try startup again",
        onPress: retry,
      },
    };
  } else if (state.blockingState?.kind === "plan-load-blocked") {
    stateScreenProps = {
      ...state.blockingState.stateScreenProps,
      primaryAction: {
        label: state.blockingState.stateScreenProps.showSpinner ? "Try now" : "Try again",
        accessibilityLabel: "Try startup again",
        onPress: retry,
      },
    };
  }

  const hasBlockingState = sendingConfrontation !== null || state.blockingState !== null;

  return {
    isReady: state.status === "ready",
    hasBlockingState,
    stateScreenProps,
    retry,
  };
}

async function flushQueueOrBlockStartup(
  sending: Sending,
  dispatch: Dispatch<StartupEvent>,
): Promise<boolean> {
  const flushResult = await sending.flushQueue();

  if (flushResult.kind !== "server-unreachable") return true;

  dispatch({ type: "server-unreachable" });
  return false;
}

function startupReducer(state: StartupState, event: StartupEvent): StartupState {
  switch (event.type) {
    case "startup-started":
      return { status: "running", blockingState: null };

    case "server-unreachable":
      return {
        status: "blocked",
        blockingState: { kind: "server-unavailable" },
      };

    case "plan-load-blocked":
      return {
        status: "blocked",
        blockingState: {
          kind: "plan-load-blocked",
          stateScreenProps: event.stateScreenProps,
        },
      };

    case "startup-succeeded":
      return { status: "ready", blockingState: null };

    default:
      assertNever(event);
      return state;
  }
}

function createSendingConfrontationStateScreenProps(sending: Sending): StateScreenProps | null {
  const confrontation = sending.serverConfrontation.state;
  if (confrontation === null) return null;

  return {
    title: confrontation.title,
    message: confrontation.message,
    detail: __DEV__ ? confrontation.technicalMessage : undefined,
    primaryAction: {
      label: confrontation.primaryActionLabel,
      accessibilityLabel: confrontation.primaryActionLabel,
      onPress: sending.serverConfrontation.accept,
    },
    secondaryAction:
      confrontation.secondaryActionLabel === undefined
        ? undefined
        : {
            label: confrontation.secondaryActionLabel,
            accessibilityLabel: confrontation.secondaryActionLabel,
            kind: "secondary",
            onPress: sending.serverConfrontation.chooseSecondaryAction,
          },
  };
}
