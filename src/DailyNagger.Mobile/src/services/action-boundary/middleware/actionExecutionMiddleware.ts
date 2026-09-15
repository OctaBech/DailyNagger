import type { ExecutionMiddleware } from "@/middleware";
import type { ActionExecutionContext } from "../events";

export type ActionExecutionWrapper = ExecutionMiddleware<ActionExecutionContext>;
