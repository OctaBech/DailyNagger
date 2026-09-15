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
import { assertNever } from "@/shared";
import {
  continuePackedSpan,
  packActiveSpan,
  recordBreadcrumb,
  startNewSpan,
  type PackedSpan,
} from "../sentry";

export function useSendingObservability(parcelFlowEvents: ParcelFlowEvents): ParcelQueueMiddleware {
  useEffect(() => {
    return parcelFlowEvents.subscribe((eventType, event) => {
      recordParcelFlowEvent(eventType, event);
    });
  }, [parcelFlowEvents]);

  return {
    hibernateMiddlewareContext,
    wakeMiddlewareContext,
  };
}

function hibernateMiddlewareContext(): ParcelQueueMiddlewareContext {
  return packActiveSpan();
}

function wakeMiddlewareContext(
  middlewareContexts: readonly ParcelQueueMiddlewareContext[],
  run: () => Promise<ParcelQueueInstruction>,
): Promise<ParcelQueueInstruction> {
  return continuePackedSpan(getPackedSpan(middlewareContexts), () =>
    startNewSpan({
      name: "parcel.batch.send",
      operation: "dn.sending.batch",
      run,
    }),
  );
}

function getPackedSpan(
  middlewareContexts: readonly ParcelQueueMiddlewareContext[],
): PackedSpan | null {
  const packedSpan = middlewareContexts.find(isPackedSpan);

  return packedSpan ?? null;
}

function isPackedSpan(
  middlewareContext: ParcelQueueMiddlewareContext,
): middlewareContext is PackedSpan {
  return (
    typeof middlewareContext === "object" &&
    middlewareContext !== null &&
    "sentryTrace" in middlewareContext
  );
}

function recordParcelFlowEvent(eventType: ParcelFlowEventType, event: ParcelFlowEvent): void {
  switch (eventType) {
    case "parcel.created":
    case "parcel.queued":
    case "parcel.coalesced":
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

    case "sending.queue.mmkv_restore_failed":
      recordParcelFlowError(eventType, event);
      return;

    default:
      assertNever(eventType);
  }
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
      "dn.parcel.id": event.parcel?.stamp.parcelId,
      "dn.parcel.ids": getParcelIds(event.parcels ?? event.batch?.parcels),
      "dn.replaced_parcel.id": event.replacedParcel?.stamp.parcelId,
      "dn.send.result": event.result?.kind,
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


