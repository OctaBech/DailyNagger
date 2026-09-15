import type { StateScreenProps } from "@/components/primitives";
import { assertNever } from "@/shared";

export type StartupState = {
  readonly status: StartupStatus;
  readonly blockingState: StartupBlockingState | null;
};

export type StartupStatus = "not-started" | "running" | "blocked" | "ready";

export type StartupBlockingState =
  | { readonly kind: "server-unavailable" }
  | { readonly kind: "plan-load-blocked"; readonly stateScreenProps: StateScreenProps };

export type StartupReducerEvent =
  | { readonly type: "startup-started" }
  | { readonly type: "server-unreachable" }
  | { readonly type: "plan-load-blocked"; readonly stateScreenProps: StateScreenProps }
  | { readonly type: "startup-succeeded" };

export const initialStartupState: StartupState = {
  status: "not-started",
  blockingState: null,
};

export function startupReducer(state: StartupState, event: StartupReducerEvent): StartupState {
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
