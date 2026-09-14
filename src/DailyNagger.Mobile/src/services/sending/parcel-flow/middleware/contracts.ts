import type { Parcel, ParcelBatch, ParcelQueueInstruction } from "../contracts";

export type ParcelQueueMiddlewarePayload = Record<string, unknown>;

export type ParcelQueueMiddleware = {
  readonly getPayloadForQueuedParcel?: (parcel: Parcel) => ParcelQueueMiddlewarePayload;
  readonly runParcelBatchSend?: (
    batch: ParcelBatch,
    run: () => Promise<ParcelQueueInstruction>,
  ) => Promise<ParcelQueueInstruction>;
};

