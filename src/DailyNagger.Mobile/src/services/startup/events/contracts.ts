import type { EventEmitter } from "@/shared";

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

export type StartupExecutionContext = {
  readonly causalityKey: string;
  readonly startedAt: string;
};

export type StartupEvent = StartupExecutionContext & {
  readonly error?: unknown;
  readonly step?: StartupStep;
};

export type StartupEvents = EventEmitter<StartupEventType, StartupEvent>;
