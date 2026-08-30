import type { Observability } from "./observabilityContext";
import { mergeObservability } from "./observabilityContext";
import { buildCausalityKeyAttributes } from "./causalityKeyList";
import { createSpanContinuation, recordContinuedSpan } from "./recordContinuedSpan";

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

type SendingDecision =
  | "connection-lost-backoff"
  | "sent"
  | "unrepairable-blocked"
  | "unrepairable-discarded"
  | "version-conflict-blocked"
  | "version-conflict-discard"
  | "version-conflict-force";

type ObservableBatchItem = {
  readonly observability: Observability;
  readonly stamp: {
    readonly parcelId: string;
    readonly queuedAt: string;
  };
};

export function recordParcelQueued(
  observability: Observability,
  details: ParcelQueuedDetails,
): Observability {
  const { causality } = observability.context;
  const attributes = {
    "dn.causality.id": causality.id,
    "dn.causality.key": causality.key,
    "dn.coalesce.key": details.coalesceKey ?? "",
    "dn.formula.type": details.formulaType,
    "dn.owner.id": details.ownerId ?? "",
    "dn.owner.type": details.ownerType ?? "",
    "dn.parcel.id": details.parcelId,
    ...buildCausalityKeyAttributes(observability.causalityKeys),
  };

  return recordContinuedSpan(
    {
      attributes,
      breadcrumbCategory: "sending",
      breadcrumbMessage: "parcel queued",
      name: "parcel queued",
      observability,
      operation: "dn.sending.queued",
    },
    (span) => ({
      ...observability,
      spanContinuation: createSpanContinuation(span),
    }),
  );
}

export function recordParcelCoalesced(
  winner: Observability,
  victim: Observability,
  details: ParcelCoalescedDetails,
): Observability {
  const coalescedObservability = mergeObservability(winner, [victim]);

  const attributes = {
    "dn.coalesce.key": details.coalesceKey ?? "",
    "dn.victim.causality.keys": victim.causalityKeys.join(","),
    "dn.victim.parcel.id": details.victimParcelId,
    "dn.winner.causality.key": winner.context.causality.key,
    "dn.winner.parcel.id": details.winnerParcelId,
    ...buildCausalityKeyAttributes(coalescedObservability.causalityKeys),
  };

  return recordContinuedSpan(
    {
      attributes,
      breadcrumbCategory: "sending",
      breadcrumbMessage: "parcel coalesced",
      name: "parcel coalesced",
      observability: coalescedObservability,
      operation: "dn.sending.coalesced",
    },
    (span) => ({
      ...coalescedObservability,
      spanContinuation: createSpanContinuation(span),
    }),
  );
}

export function recordSendingBatchPrepared(batch: readonly ObservableBatchItem[]): Observability {
  const observability = createBatchObservability(batch);
  const { causality } = observability.context;

  return recordContinuedSpan(
    {
      attributes: {
        "dn.batch.size": batch.length,
        "dn.causality.id": causality.id,
        "dn.causality.key": causality.key,
        "dn.parcel.ids": batch.map((parcel) => parcel.stamp.parcelId).join(","),
        ...buildCausalityKeyAttributes(observability.causalityKeys),
      },
      breadcrumbCategory: "sending",
      breadcrumbMessage: "batch prepared",
      name: "batch prepared",
      observability,
      operation: "dn.sending.batch",
    },
    (span) => ({
      ...observability,
      spanContinuation: createSpanContinuation(span),
    }),
  );
}

export function recordSendingRequest<TResult>(
  observability: Observability,
  details: SendingRequestDetails,
  run: () => TResult,
): TResult {
  const { causality } = observability.context;
  const attributes = {
    "dn.batch.size": details.batchSize,
    "dn.causality.id": causality.id,
    "dn.causality.key": causality.key,
    "dn.parcel.id": details.parcelId,
    ...buildCausalityKeyAttributes(observability.causalityKeys),
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

export function recordSendingDecision(
  batch: readonly ObservableBatchItem[],
  decision: SendingDecision,
): void {
  if (batch.length === 0) return;

  const observability = createBatchObservability(batch);
  const { causality } = observability.context;

  recordContinuedSpan(
    {
      attributes: {
        "dn.batch.size": batch.length,
        "dn.causality.id": causality.id,
        "dn.causality.key": causality.key,
        "dn.decision": decision,
        "dn.parcel.ids": batch.map((parcel) => parcel.stamp.parcelId).join(","),
        ...buildCausalityKeyAttributes(observability.causalityKeys),
      },
      breadcrumbCategory: "sending",
      breadcrumbMessage: decision,
      name: decision,
      observability,
      operation: "dn.sending.decision",
    },
    () => undefined,
  );
}

function createBatchObservability(batch: readonly ObservableBatchItem[]): Observability {
  const [first, ...rest] = batch;
  return mergeObservability(
    first.observability,
    rest.map((parcel) => parcel.observability),
  );
}
