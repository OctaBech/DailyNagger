import * as Sentry from "@sentry/react-native";
import type { CommandTraceKey } from "./commandTraceKey";

type SendingOperation = "parcel-queued" | "parcel-coalesced";

type RecordSendingOperationInput = {
  readonly coalesceKey: string | null;
  readonly commandTraceKeys: readonly CommandTraceKey[];
  readonly formulaType: string;
  readonly operation: SendingOperation;
  readonly ownerId: string | null;
  readonly ownerType: string | null;
  readonly parcelId: string;
};

export function recordSendingOperation(input: RecordSendingOperationInput): void {
  Sentry.addBreadcrumb({
    category: "sending",
    data: {
      coalesceKey: input.coalesceKey,
      commandTraceKey: input.commandTraceKeys[0],
      commandTraceKeys: input.commandTraceKeys.join(","),
      formulaType: input.formulaType,
      ownerId: input.ownerId,
      ownerType: input.ownerType,
      parcelId: input.parcelId,
    },
    level: "info",
    message: input.operation,
  });
}
