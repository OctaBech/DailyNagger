import * as Sentry from "@sentry/react-native";
import type { ParcelObservability } from "./observabilityContext";
import { createCausalityKeyAttributes } from "./causalityKeyList";
import { recordContinuedSpan } from "./recordContinuedSpan";

type SendingOperation = "parcel-queued" | "parcel-coalesced" | "request";

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

type SendingRequestDetails = {
  readonly batchSize: number;
  readonly endpoint: string;
  readonly method: string;
  readonly parcelId: string;
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

export function recordSendingRequest<TResult>(
  observability: ParcelObservability,
  details: SendingRequestDetails,
  run: () => TResult,
): TResult {
  const { causality } = observability.context;
  const attributes = {
    "dn.batch.size": details.batchSize,
    "dn.causality.id": causality.id,
    "dn.causality.key": causality.key,
    "dn.parcel.id": details.parcelId,
    ...createCausalityKeyAttributes(observability.causalityKeys),
    "http.method": details.method,
    "http.route": details.endpoint,
  };

  return recordContinuedSpan(
    {
      attributes,
      breadcrumbCategory: "sending",
      breadcrumbMessage: `${details.method} ${details.endpoint}`,
      name: `${details.method} ${details.endpoint}`,
      observability,
      operation: "dn.sending.request",
    },
    run,
  );
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
