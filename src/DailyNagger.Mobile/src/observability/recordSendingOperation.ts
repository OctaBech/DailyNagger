import * as Sentry from "@sentry/react-native";
import type { ParcelObservability } from "./observabilityContext";
import { createCausalityKeyAttributes } from "./causalityKeyList";

type SendingOperation = "parcel-queued" | "parcel-coalesced";

type ParcelQueuedDetails = {
  readonly coalesceKey: string | null;
  readonly formulaType: string;
  readonly ownerId: string | null;
  readonly ownerType: string | null;
  readonly parcelId: string;
};

type ParcelCoalescedDetails = {
  readonly coalesceKey: string | null;
  readonly victimParcelId: string;
  readonly winnerParcelId: string;
};

export function recordParcelQueued(
  observability: ParcelObservability,
  details: ParcelQueuedDetails,
): ParcelObservability {
  recordSendingBreadcrumb(observability, "parcel-queued", {
    coalesceKey: details.coalesceKey,
    formulaType: details.formulaType,
    ownerId: details.ownerId,
    ownerType: details.ownerType,
    parcelId: details.parcelId,
  });

  return observability;
}

export function recordParcelCoalesced(
  winner: ParcelObservability,
  victim: ParcelObservability,
  details: ParcelCoalescedDetails,
): ParcelObservability {
  const coalescedObservability = {
    ...winner,
    causalityKeys: [...new Set([...winner.causalityKeys, ...victim.causalityKeys])],
  };

  const attributes = {
    "dn.coalesce.key": details.coalesceKey ?? "",
    "dn.victim.causality.keys": victim.causalityKeys.join(","),
    "dn.victim.parcel.id": details.victimParcelId,
    "dn.winner.causality.key": winner.context.causality.key,
    "dn.winner.parcel.id": details.winnerParcelId,
    ...createCausalityKeyAttributes(coalescedObservability.causalityKeys),
  };

  const span = Sentry.startInactiveSpan({
    attributes,
    name: "parcel coalesced",
    op: "dn.sending.coalesce",
  });

  try {
    recordSendingBreadcrumb(coalescedObservability, "parcel-coalesced", attributes);
  } finally {
    span.end();
  }

  return coalescedObservability;
}

function recordSendingBreadcrumb(
  observability: ParcelObservability,
  operation: SendingOperation,
  data: Record<string, string | null>,
): void {
  const { causality } = observability.context;

  Sentry.addBreadcrumb({
    category: "sending",
    data: {
      "dn.causality.id": causality.id,
      "dn.causality.key": causality.key,
      ...data,
    },
    level: "info",
    message: operation,
  });
}
