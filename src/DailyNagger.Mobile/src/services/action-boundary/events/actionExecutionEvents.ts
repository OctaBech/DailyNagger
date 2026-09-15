import type { EventEmitter } from "@/shared";
import type { MiddlewareExecutionContext } from "@/middleware";

export type ActionExecutionEventType = "action-started" | "action-finished" | "action-failed";

export type ActionExecutionContext = MiddlewareExecutionContext;

export type ActionExecutionEvent = ActionExecutionContext & {
  readonly error?: unknown;
};

export type ActionEvents = EventEmitter<ActionExecutionEventType, ActionExecutionEvent>;
