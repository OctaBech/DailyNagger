import type { EventEmitter } from "@/shared";
import type { ActionScope } from "../action-dependencies/actionRuntimeDependencies";

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

export type ActionExecutionWrapper = <TResult>(
  context: ActionExecutionContext,
  run: () => TResult,
) => TResult;
