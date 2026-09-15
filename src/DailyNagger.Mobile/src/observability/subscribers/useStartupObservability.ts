import { useCallback, useEffect } from "react";
import type {
  StartupEvent,
  StartupEvents,
  StartupEventType,
  StartupExecutionContext,
  StartupMiddleware,
} from "@/services/startup";
import { assertNever } from "@/shared";
import { recordBreadcrumb, recordSpanValue, startNewSpan } from "../sentry";

export function useStartupObservability(startupEvents: StartupEvents): StartupMiddleware {
  useEffect(() => {
    return startupEvents.subscribe((eventType, event) => {
      recordStartupEvent(eventType, event);
    });
  }, [startupEvents]);

  const runStartup: StartupMiddleware["runStartup"] = useCallback(
    <TResult>(context: StartupExecutionContext, run: () => Promise<TResult>) => {
      return recordStartupRun(context, run);
    },
    [],
  );

  return { runStartup };
}

function recordStartupRun<TResult>(
  context: StartupExecutionContext,
  run: () => Promise<TResult>,
): Promise<TResult> {
  return startNewSpan({
    name: "startup/run",
    operation: "dn.startup",
    run: async () => {
      recordSpanValue("dn.causality.key", context.causalityKey);
      recordSpanValue("dn.startup.started_at", context.startedAt);

      return run();
    },
  });
}

function recordStartupEvent(eventType: StartupEventType, event: StartupEvent): void {
  switch (eventType) {
    case "startup.failed":
      recordStartupFailure(eventType, event);
      return;

    case "startup.blocked.server_unavailable":
    case "startup.blocked.plan_load":
      recordStartupBlocked(eventType, event);
      return;

    case "startup.started":
    case "startup.ready":
    case "startup.flush-before-load.started":
    case "startup.flush-before-load.finished":
    case "startup.flush-before-load.failed":
    case "startup.load-plan.started":
    case "startup.load-plan.finished":
    case "startup.load-plan.failed":
    case "startup.rollover.started":
    case "startup.rollover.finished":
    case "startup.rollover.failed":
    case "startup.flush-after-rollover.started":
    case "startup.flush-after-rollover.finished":
    case "startup.flush-after-rollover.failed":
      recordStartupBreadcrumb(eventType, event);
      return;

    default:
      assertNever(eventType);
  }
}

function recordStartupFailure(eventType: StartupEventType, event: StartupEvent): void {
  recordStartupBreadcrumb(eventType, event, "error");
  recordSpanValue("dn.startup.failed", true);
}

function recordStartupBlocked(eventType: StartupEventType, event: StartupEvent): void {
  recordStartupBreadcrumb(eventType, event, "warning");
  recordSpanValue("dn.startup.blocked", true);
}

function recordStartupBreadcrumb(
  eventType: StartupEventType,
  event: StartupEvent,
  level: "info" | "warning" | "error" = "info",
): void {
  recordBreadcrumb({
    category: "startup",
    data: {
      "dn.causality.key": event.causalityKey,
      "dn.startup.started_at": event.startedAt,
      "dn.startup.step": event.step,
    },
    level,
    message: eventType,
  });
}


