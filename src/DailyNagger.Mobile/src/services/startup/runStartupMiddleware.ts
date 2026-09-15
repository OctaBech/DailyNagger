import { runWithOptionalMiddleware } from "@/middleware";
import type { StartupExecutionContext } from "./events";
import type { StartupMiddleware } from "./startupMiddleware";

export async function runWithStartupMiddleware<TResult>(
  startupMiddleware: StartupMiddleware | undefined,
  context: StartupExecutionContext,
  run: () => Promise<TResult>,
): Promise<TResult> {
  return runWithOptionalMiddleware(startupMiddleware?.runStartup, context, run);
}

export function createStartupExecutionContext(): StartupExecutionContext {
  const startedAt = new Date().toISOString();

  return {
    causalityKey: `startup/run:${startedAt}`,
    startedAt,
  };
}

