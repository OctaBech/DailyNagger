import type { ActionExecutionContext } from "../events";

export type ActionExecutionWrapper = <TResult>(
  context: ActionExecutionContext,
  run: () => TResult,
) => TResult;
