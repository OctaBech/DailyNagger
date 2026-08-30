import { buildObservabilityContext, type Observability } from "./observabilityContext";
import { recordContinuedSpan } from "./recordContinuedSpan";
import { recordObservability } from "./recordObservability";

type StartupStep = "flush-before-load" | "load-plan" | "rollover" | "flush-after-rollover";

export function recordStartupOperation(): Observability {
  const context = buildObservabilityContext({
    key: "startup/run",
    kind: "startup/run",
    label: "Startup",
    source: "system-startup",
  });

  return recordObservability({
    breadcrumbCategory: "startup",
    context,
    operation: "dn.startup",
  });
}

export function recordStartupStep<TResult>(
  observability: Observability,
  step: StartupStep,
  run: () => TResult,
): TResult {
  const { causality } = observability.context;

  return recordContinuedSpan(
    {
      attributes: {
        "dn.causality.id": causality.id,
        "dn.causality.key": causality.key,
        "dn.startup.step": step,
      },
      breadcrumbCategory: "startup",
      breadcrumbMessage: step,
      name: step,
      observability,
      operation: "dn.startup.step",
    },
    run,
  );
}
