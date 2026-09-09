import type { EventEmitter } from "@/shared";
import type { ActionScope } from "./actionRuntimeDependencies";

export type ActionExecutionEventType = "action-started" | "action-finished" | "action-failed";

export type ActionExecutionContext = {
  readonly actionKey: string;
  readonly actionScope: ActionScope;
  readonly causalityKey: string;
  readonly startedAt: string;
};

export type ActionExecutionEvent = ActionExecutionContext & {
  readonly error?: unknown;
};

export type ActionEvents = EventEmitter<ActionExecutionEventType, ActionExecutionEvent>;

export function createActionExecutionContext(input: {
  readonly actionKey: string;
  readonly actionScope: ActionScope;
}): ActionExecutionContext {
  const startedAt = new Date().toISOString();

  return {
    ...input,
    causalityKey: `${input.actionKey}:${startedAt}`,
    startedAt,
  };
}

export function runActionWithEvents<TResult>(
  actionEvents: ActionEvents | undefined,
  context: ActionExecutionContext,
  run: () => TResult,
): TResult {
  actionEvents?.emit("action-started", context);

  try {
    const result = run();
    actionEvents?.emit("action-finished", context);
    return result;
  } catch (error) {
    actionEvents?.emit("action-failed", { ...context, error });
    throw error;
  }
}
