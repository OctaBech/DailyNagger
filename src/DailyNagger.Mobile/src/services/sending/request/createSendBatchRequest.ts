import type { SendApiRequest } from "@/api/client/sendApiRequest";
import type { Parcel, Stamp } from "../contracts";
import { logSendingRequest } from "../logging/logSendingRequest";
import { recordMergedObservability, type Observability } from "@/observability";

export function createSendBatchRequest(batch: Parcel[]): SendApiRequest {
  const { ownerType, ownerId, sendMethod, endpointPath, canBatch } = batch[0].formula;
  const mergedStamp = mergeBatchStamps(batch);

  const payload = canBatch
    ? batch.map((parcel) => parcel.formula.payload)
    : batch[0].formula.payload;

  const request = {
    method: sendMethod,
    endpoint: endpointPath,
    payload,
    processing: mergedStamp,
  } satisfies SendApiRequest;

  logSendingRequest(request, ownerType, ownerId);

  return request;
}

type BatchProcessingStamp = Stamp & {
  readonly batchSize: number;
  readonly observability: Observability;
};

function mergeBatchStamps(batch: readonly Parcel[]): BatchProcessingStamp {
  const firstStamp = batch[0].stamp;

  let baseVersion = firstStamp.baseVersion;
  let nextVersion = firstStamp.nextVersion;
  let skipPayloadVersionValidation = firstStamp.skipPayloadVersionValidation === true;
  let observability = batch[0].observability;

  for (const parcel of batch.slice(1)) {
    observability = recordMergedObservability(observability, [parcel.observability]);

    if (parcel.stamp.baseVersion !== undefined) {
      baseVersion =
        baseVersion === undefined
          ? parcel.stamp.baseVersion
          : Math.min(parcel.stamp.baseVersion, baseVersion);
    }

    if (parcel.stamp.nextVersion !== undefined) {
      nextVersion =
        nextVersion === undefined
          ? parcel.stamp.nextVersion
          : Math.max(parcel.stamp.nextVersion, nextVersion);
    }
    skipPayloadVersionValidation ||= parcel.stamp.skipPayloadVersionValidation === true;
  }

  return {
    parcelId: firstStamp.parcelId,
    queuedAt: firstStamp.queuedAt,
    clientIdentity: firstStamp.clientIdentity,
    batchSize: batch.length,
    observability,
    ...(baseVersion === undefined ? {} : { baseVersion }),
    ...(nextVersion === undefined ? {} : { nextVersion }),
    ...(skipPayloadVersionValidation ? { skipPayloadVersionValidation } : {}),
  };
}
