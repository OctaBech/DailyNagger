import type { EventEmitter } from "@/shared";
import type { MiddlewareExecutionContext } from "@/middleware";

export type StartupStep = "flush-before-load" | "load-plan" | "rollover" | "flush-after-rollover";

export type StartupEventType =
  | "startup.started"
  | "startup.ready"
  | "startup.failed"
  | "startup.blocked.server_unavailable"
  | "startup.blocked.plan_load"
  | `startup.${StartupStep}.started`
  | `startup.${StartupStep}.finished`
  | `startup.${StartupStep}.failed`;

export type StartupExecutionContext = MiddlewareExecutionContext;

export type StartupEvent = StartupExecutionContext & {
  readonly error?: unknown;
  readonly step?: StartupStep;
};

export type StartupEvents = EventEmitter<StartupEventType, StartupEvent>;
