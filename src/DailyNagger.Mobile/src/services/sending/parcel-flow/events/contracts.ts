import type { EventEmitter } from "@/shared";
import type { Parcel, ParcelBatch, SendBatchResult } from "../contracts";

export type ParcelFlowEventType =
  | "parcel.created"
  | "parcel.inserted"
  | "parcel.removed.by.coalescing"
  | "parcel.batch.started"
  | "parcel.batch.send.started"
  | "parcel.batch.send.finished"
  | "sending.queue.mmkv_restore_failed";

export type ParcelFlowEvent = {
  readonly parcel?: Parcel;
  readonly parcels?: readonly Parcel[];
  readonly batch?: ParcelBatch;
  readonly result?: SendBatchResult;
};

export type ParcelFlowEvents = EventEmitter<ParcelFlowEventType, ParcelFlowEvent>;

