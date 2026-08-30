import type { Guid } from "@/shared";
import { buildObservabilityContext, type Observability } from "./observabilityContext";
import { recordObservability } from "./recordObservability";

type UserMoodOperation = "select";

type RecordUserMoodOperationInput = {
  readonly selectionId: Guid;
  readonly operation: UserMoodOperation;
};

export function recordUserMoodOperation({
  selectionId,
  operation,
}: RecordUserMoodOperationInput): Observability {
  const context = buildObservabilityContext({
    key: `user-mood:${selectionId}/${operation}`,
    kind: `user-mood/${operation}`,
    label: "Selected user mood",
    source: "user-mood",
  });

  return recordObservability({
    breadcrumbCategory: "user-mood",
    context,
    operation: "dn.user-mood",
  });
}
