import type { ParcelBatch, SendBatchResult } from "../contracts";
import type { ParcelFlowEvents, ParcelFlowEventType } from "./contracts";

export function emitParcelBatchEvent(
  parcelFlowEvents: ParcelFlowEvents | undefined,
  eventType: ParcelFlowEventType,
  batch: ParcelBatch,
  result?: SendBatchResult,
): void {
  for (const parcel of batch.parcels) {
    parcelFlowEvents?.emit(eventType, {
      parcel,
      parcels: batch.parcels,
      batch,
      ...(result === undefined ? {} : { result }),
    });
  }
}
