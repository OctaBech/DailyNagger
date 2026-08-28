import * as Sentry from "@sentry/react-native";
import type { ObservabilityContext } from "./observabilityContext";

type SendingOperation = "parcel-queued" | "parcel-coalesced";

type RecordSendingOperationInput = {
  readonly coalesceKey: string | null;
  readonly formulaType: string;
  readonly operation: SendingOperation;
  readonly ownerId: string | null;
  readonly ownerType: string | null;
  readonly parcelId: string;
};

export function recordSendingOperation(
  observabilityContext: ObservabilityContext,
  input: RecordSendingOperationInput,
): void {
  const { causality } = observabilityContext;

  Sentry.addBreadcrumb({
    category: "sending",
    data: {
      coalesceKey: input.coalesceKey,
      "dn.causality.id": causality.id,
      "dn.causality.key": causality.key,
      formulaType: input.formulaType,
      ownerId: input.ownerId,
      ownerType: input.ownerType,
      parcelId: input.parcelId,
    },
    level: "info",
    message: input.operation,
  });
}
