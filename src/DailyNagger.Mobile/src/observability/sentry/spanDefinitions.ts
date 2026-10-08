export const spanNames = {
  parcelBatchSend: "parcel.batch.send",
  parcelCoalesced: "parcel.coalesced",
  parcelBatched: "parcel.batched",
} as const;

export const spanOperations = {
  sendingBatch: "dn.sending.batch",
  sendingCoalesced: "dn.sending.coalesced",
  sendingBatched: "dn.sending.batched",
} as const;
