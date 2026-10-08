import type { Parcel, ParcelBatch, ParcelQueueInstruction } from "./contracts";

export type ParcelQueueMiddlewareContext = unknown;

export type ParcelQueueMiddleware = {
  readonly packContextMiddleware?: (
    parcel: Parcel,
    run: () => ParcelQueueMiddlewareContext,
  ) => ParcelQueueMiddlewareContext;
  readonly wakeMiddlewareContext?: (
    batch: ParcelBatch,
    run: () => Promise<ParcelQueueInstruction>,
  ) => Promise<ParcelQueueInstruction>;
};
