import type { AsyncExecutionMiddleware } from "@/middleware";
import type { StartupExecutionContext } from "./events";

export type StartupMiddleware = {
  readonly runStartup?: AsyncExecutionMiddleware<StartupExecutionContext>;
};

