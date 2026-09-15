import type { StateScreenProps } from "@/components/primitives";
import type { StartupState } from "./startupState";

export type StartupStateScreenContent = Omit<StateScreenProps, "primaryAction"> & {
  readonly primaryActionLabel: string;
};

export function createStartupStateScreenContent(
  state: StartupState,
): StartupStateScreenContent | null {
  if (state.blockingState?.kind === "server-unavailable") {
    return {
      title: "Server unavailable",
      message:
        "DailyNagger could not connect to the server. Check that the backend is running and try again.",
      primaryActionLabel: "Try again",
    };
  }

  if (state.blockingState?.kind === "plan-load-blocked") {
    return {
      ...state.blockingState.stateScreenProps,
      primaryActionLabel: state.blockingState.stateScreenProps.showSpinner
        ? "Try now"
        : "Try again",
    };
  }

  return null;
}
