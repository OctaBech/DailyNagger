import type { EventEmitter } from "@/shared";
import type { Parcel, ParcelBatch, SendBatchResult } from "../contracts";

export type ParcelFlowEventType =
  | "parcel.created"
  | "parcel.queued"
  | "parcel.coalesced"
  | "parcel.batch.waiting"
  | "parcel.batch.sent"
  | "parcel.batch.failed_to_connect"
  | "parcel.batch.blocked_by_version_conflict"
  | "parcel.batch.blocked_by_unrepairable_update"
  | "parcel.batch.discarded"
  | "parcel.batch.forced"
  | "sending.queue.mmkv_restore_failed";

export type ParcelFlowEvent = {
  readonly parcel?: Parcel;
  readonly replacedParcel?: Parcel;
  readonly parcels?: readonly Parcel[];
  readonly batch?: ParcelBatch;
  readonly result?: SendBatchResult;
};

export type ParcelFlowEvents = EventEmitter<ParcelFlowEventType, ParcelFlowEvent>;
