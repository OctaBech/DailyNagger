import type { Dispatch } from "react";
import type { Sending } from "../sending";
import type { StartupEvents, StartupExecutionContext, StartupStep } from "./events";
import type { StartupReducerEvent } from "./startupState";

export async function runStartupStep<TResult>(
  startupEvents: StartupEvents,
  context: StartupExecutionContext,
  step: StartupStep,
  run: () => Promise<TResult>,
): Promise<TResult> {
  const stepContext = { ...context, step };
  startupEvents.emit(`startup.${step}.started`, stepContext);

  try {
    const result = await run();

    startupEvents.emit(`startup.${step}.finished`, stepContext);
    return result;
  } catch (error) {
    startupEvents.emit(`startup.${step}.failed`, { ...stepContext, error });
    throw error;
  }
}

export function blockStartupBecauseServerIsUnavailable(
  startupEvents: StartupEvents,
  context: StartupExecutionContext,
  dispatch: Dispatch<StartupReducerEvent>,
): void {
  dispatch({ type: "server-unreachable" });
  startupEvents.emit("startup.blocked.server_unavailable", context);
}

export async function flushQueue(sending: Sending): Promise<boolean> {
  const flushResult = await sending.flushQueue();

  return flushResult.kind !== "server-unreachable";
}
