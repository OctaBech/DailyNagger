import { buildObservabilityContext, type Observability } from "./observabilityContext";
import { recordObservability } from "./recordObservability";

type RolloverOperation = "close-task-log" | "nagger";

type RecordRolloverOperationInput = {
  readonly key: string;
  readonly label: string;
  readonly operation: RolloverOperation;
};

export function recordRolloverOperation({
  key,
  label,
  operation,
}: RecordRolloverOperationInput): Observability {
  const context = buildObservabilityContext({
    key,
    kind: `rollover/${operation}`,
    label,
    source: "system-sync",
  });

  return recordObservability({
    breadcrumbCategory: "rollover",
    context,
    operation: "dn.rollover",
  });
}
