import { useEffect } from "react";
import type {
  Parcel,
  ParcelBatch,
  ParcelFlowEvent,
  ParcelFlowEvents,
  ParcelFlowEventType,
  ParcelQueueInstruction,
  ParcelQueueMiddlewareContext,
  ParcelQueueMiddleware,
} from "@/services/sending";
import { assertNever } from "@/shared/assertNever";
import { newGuid } from "@/shared/guid";
import {
  packActiveSpan,
  recordBreadcrumb,
  recordSpanValue,
  reportMessage,
  runWithPackedSpan,
  spanAttributeKeys,
  spanNames,
  spanOperations,
  type PackedSpan,
} from "../sentry";

export function useSendingObservability(parcelFlowEvents: ParcelFlowEvents): ParcelQueueMiddleware {
  useEffect(() => {
    return parcelFlowEvents.subscribe((eventType, event) => {
      recordParcelFlowEvent(eventType, event);
    });
  }, [parcelFlowEvents]);

  return {
    packContextMiddleware,
    wakeMiddlewareContext,
  };
}

function packContextMiddleware(): ParcelQueueMiddlewareContext {
  return packActiveSpan();
}

function wakeMiddlewareContext(
  batch: ParcelBatch,
  run: () => Promise<ParcelQueueInstruction>,
): Promise<ParcelQueueInstruction> {
  const ownerIndex = batch.middlewareContexts.findLastIndex(isPackedSpan);
  const ownerContext = batch.middlewareContexts[ownerIndex];
  const packedSpan = isPackedSpan(ownerContext) ? ownerContext : null;
  const attemptId = newGuid();

  if (packedSpan !== null) {
    recordBatchParticipants(batch, ownerIndex, packedSpan, attemptId);
  }

  return runWithPackedSpan(packedSpan, {
    name: spanNames.parcelBatchSend,
    operation: spanOperations.sendingBatch,
    run: () => {
      recordSpanValue(spanAttributeKeys.sendAttemptId, attemptId);
      return run();
    },
  });
}

function recordBatchParticipants(
  batch: ParcelBatch,
  ownerIndex: number,
  ownerContext: PackedSpan,
  attemptId: string,
): void {
  batch.middlewareContexts.forEach((context, index) => {
    if (index === ownerIndex || !isPackedSpan(context)) return;

    runWithPackedSpan(context, {
      name: spanNames.parcelBatched,
      operation: spanOperations.sendingBatched,
      run: () => {
        recordSpanValue(spanAttributeKeys.sendAttemptId, attemptId);
        recordSpanValue(spanAttributeKeys.parcelId, batch.parcels[index]?.stamp.parcelId);
        const ownerKey = ownerContext[spanAttributeKeys.causalityKey];
        if (ownerKey !== null) {
          recordSpanValue(spanAttributeKeys.batchedWithCausalityKey, ownerKey);
        }
      },
    });
  });
}

function isPackedSpan(
  middlewareContext: ParcelQueueMiddlewareContext,
): middlewareContext is PackedSpan {
  return (
    typeof middlewareContext === "object" &&
    middlewareContext !== null &&
    "sentryTrace" in middlewareContext &&
    typeof middlewareContext.sentryTrace === "string" &&
    "baggage" in middlewareContext &&
    (middlewareContext.baggage === null || typeof middlewareContext.baggage === "string") &&
    spanAttributeKeys.causalityKey in middlewareContext &&
    (middlewareContext[spanAttributeKeys.causalityKey] === null ||
      typeof middlewareContext[spanAttributeKeys.causalityKey] === "string")
  );
}

function recordParcelFlowEvent(eventType: ParcelFlowEventType, event: ParcelFlowEvent): void {
  switch (eventType) {
    case "parcel.coalesced":
      recordCoalescedParcel(event);
      return;
    case "parcel.created":
    case "parcel.queued":
    case "parcel.batch.waiting":
    case "parcel.batch.sent":
    case "parcel.batch.discarded":
    case "parcel.batch.forced":
      recordParcelFlowBreadcrumb(eventType, event);
      return;

    case "parcel.batch.failed_to_connect":
    case "parcel.batch.blocked_by_version_conflict":
    case "parcel.batch.blocked_by_unrepairable_update":
      recordParcelFlowWarning(eventType, event);
      return;

    case "sending.queue.restore_failed":
      recordParcelFlowError(eventType, event);
      reportMessage("Persistent sending queue could not be restored");
      return;

    default:
      assertNever(eventType);
  }
}

function recordCoalescedParcel(event: ParcelFlowEvent): void {
  const replacedContext = event.replacedMiddlewareContext;
  if (!isPackedSpan(replacedContext)) {
    recordParcelFlowBreadcrumb("parcel.coalesced", event);
    return;
  }

  const replacementContext = event.middlewareContext;
  runWithPackedSpan(replacedContext, {
    name: spanNames.parcelCoalesced,
    operation: spanOperations.sendingCoalesced,
    run: () => {
      recordSpanValue(spanAttributeKeys.parcelId, event.replacedParcel?.stamp.parcelId);
      recordSpanValue(spanAttributeKeys.replacedByParcelId, event.parcel?.stamp.parcelId);
      if (isPackedSpan(replacementContext)) {
        const replacementKey = replacementContext[spanAttributeKeys.causalityKey];
        if (replacementKey !== null) {
          recordSpanValue(spanAttributeKeys.replacedByCausalityKey, replacementKey);
        }
      }
      recordParcelFlowBreadcrumb("parcel.coalesced", event);
    },
  });
}

function recordParcelFlowWarning(eventType: ParcelFlowEventType, event: ParcelFlowEvent): void {
  recordParcelFlowBreadcrumb(eventType, event, "warning");
}

function recordParcelFlowError(eventType: ParcelFlowEventType, event: ParcelFlowEvent): void {
  recordParcelFlowBreadcrumb(eventType, event, "error");
}

function recordParcelFlowBreadcrumb(
  eventType: ParcelFlowEventType,
  event: ParcelFlowEvent,
  level: "info" | "warning" | "error" = "info",
): void {
  recordBreadcrumb({
    category: "sending",
    data: {
      "dn.batch.size": getBatchSize(event.batch),
      [spanAttributeKeys.parcelId]: event.parcel?.stamp.parcelId,
      "dn.parcel.ids": getParcelIds(event.parcels ?? event.batch?.parcels),
      "dn.replaced_parcel.id": event.replacedParcel?.stamp.parcelId,
      "dn.send.result": event.result?.kind,
      "dn.queue.restore_failure_reason": event.reason,
    },
    level,
    message: eventType,
  });
}

function getBatchSize(batch: ParcelBatch | undefined): number | undefined {
  return batch?.parcels.length;
}

function getParcelIds(parcels: readonly Parcel[] | undefined): string | undefined {
  if (parcels === undefined) return undefined;

  return parcels.map((parcel) => parcel.stamp.parcelId).join(",");
}
