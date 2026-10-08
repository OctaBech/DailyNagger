export const spanAttributeKeys = {
  requestId: "dn.api.request_id",
  causalityKey: "dn.causality.key",
  replacedByCausalityKey: "dn.causality.replaced_by",
  parcelId: "dn.parcel.id",
  replacedByParcelId: "dn.parcel.replaced_by",
  batchedWithCausalityKey: "dn.causality.batched_with",
  sendAttemptId: "dn.sending.attempt_id",
} as const;
