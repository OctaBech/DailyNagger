import { ApiRequestError, apiRequest } from "@/api/client/apiRequest";
import { SendApiRequestError } from "@/api/client/sendApiRequest";
import type { VersionedMutationResponse } from "@/api/dto";
import { environment } from "@/config";
import type { ClientIdentityDto } from "@/api";
import type { ClientIdentity } from "@/models/clientIdentity";
import { assertNever } from "@/shared";
import { askHowToHandleUnrepairableUpdate, askHowToHandleVersioningError } from "../error-questions";
import type { SendingPromptController } from "../sending-prompt/useSendingPromptController";
import type { Parcel, ParcelBatch, SendBatchResult, SendParcelBatch } from "./contracts";
import type { ParcelFlowEvents } from "./events";

export function useSendParcelBatch(
  sendingPromptController: SendingPromptController,
  parcelFlowEvents?: ParcelFlowEvents,
): SendParcelBatch {
  async function sendParcelBatch(batch: ParcelBatch) {
    let currentBatch = batch;

    while (true) {
      // 1. Try to send the current batch.
      parcelFlowEvents?.emit("parcel.batch.send.started", { batch: currentBatch });
      const sendResult = await trySendBatch(currentBatch);
      parcelFlowEvents?.emit("parcel.batch.send.finished", {
        batch: currentBatch,
        result: sendResult,
      });

      // 2. A sent batch can be removed from the queue.
      if (sendResult.kind === "sent") {
        return "remove-active-batch-and-drain-next";
      }

      // 3. Lost connection keeps the batch in the queue and uses backoff.
      if (sendResult.kind === "failed-to-connect") {
        return "keep-active-batch-and-backoff";
      }

      // 4. Unrepairable server rejections are shown to the user and then discarded.
      if (sendResult.kind === "server-rejected-unrepairable-update") {
        await askHowToHandleUnrepairableUpdate(sendingPromptController, sendResult.error);
        return "remove-active-batch-and-drain-next";
      }

      // 5. Version conflicts can be discarded or force-restamped and retried immediately.
      if (sendResult.kind === "server-rejected-current-version") {
        const decision = await askHowToHandleVersioningError(
          sendingPromptController,
          sendResult.error,
        );

        if (decision === "discard-batch") {
          return "remove-active-batch-and-drain-next";
        }

        currentBatch = restampBatchForForcedSend(currentBatch, sendResult.serverVersion);
        continue;
      }

      assertNever(sendResult);
    }
  }

  function restampBatchForForcedSend(batch: ParcelBatch, serverVersion: number): ParcelBatch {
    const baseVersion = serverVersion;
    const nextVersion = serverVersion + 1;

    return {
      ...batch,
      parcels: batch.parcels.map((parcel) => ({
        ...parcel,
        stamp: {
          ...parcel.stamp,
          baseVersion,
          nextVersion,
          skipPayloadVersionValidation: true,
        },
      })),
      versioning: {
        existingVersion: baseVersion,
        newVersion: nextVersion,
      },
    };
  }

  async function trySendBatch(batch: ParcelBatch): Promise<SendBatchResult> {
    try {
      await sendBatchRequest(batch);
      return { kind: "sent" };
    } catch (error) {
      const sendError = toSendApiRequestError(error);

      if (serverRejectedCurrentVersion(sendError)) {
        if (sendError.currentVersion === null) {
          return { kind: "server-rejected-unrepairable-update", error: sendError };
        }

        return {
          kind: "server-rejected-current-version",
          error: sendError,
          serverVersion: sendError.currentVersion,
        };
      }

      if (serverRejectedUnrepairableUpdate(sendError)) {
        return { kind: "server-rejected-unrepairable-update", error: sendError };
      }

      return { kind: "failed-to-connect", error };
    }
  }

  async function sendBatchRequest(batch: ParcelBatch): Promise<VersionedMutationResponse> {
    const firstParcel = batch.parcels[0];
    const payload = firstParcel.formula.canBatch
      ? batch.parcels.map((parcel) => parcel.formula.payload)
      : firstParcel.formula.payload;

    const result = await apiRequest<VersionedMutationResponse>({
      method: firstParcel.formula.sendMethod,
      path: firstParcel.formula.endpointPath,
      body: {
        communityId: environment.communityId,
        userId: environment.userId,
        updatedAt: firstParcel.stamp.queuedAt,
        baseVersion: batch.versioning.existingVersion,
        nextVersion: batch.versioning.newVersion,
        skipPayloadVersionValidation: hasSkipPayloadVersionValidation(batch),
        clientIdentity: toClientIdentityDto(firstParcel.stamp.clientIdentity),
        payload,
      },
    });

    if (result.kind !== "ok") {
      throw new Error("Send parcel batch response had no JSON body.");
    }

    return result.body;
  }

  function hasSkipPayloadVersionValidation(batch: ParcelBatch): boolean {
    return batch.parcels.some((parcel) => parcel.stamp.skipPayloadVersionValidation === true);
  }

  function toClientIdentityDto(clientIdentity: ClientIdentity): ClientIdentityDto {
    return {
      clientId: clientIdentity.clientId,
      deviceName: clientIdentity.deviceName,
      deviceModel: clientIdentity.deviceModel,
    };
  }

  return sendParcelBatch;
}

export type { SendParcelBatch };

function serverRejectedCurrentVersion(error: unknown): error is SendApiRequestError {
  return error instanceof SendApiRequestError && error.status === 409;
}

function serverRejectedUnrepairableUpdate(error: unknown): error is SendApiRequestError {
  if (!(error instanceof SendApiRequestError)) return false;
  return error.status === 400 || error.status === 404;
}

function toSendApiRequestError(error: unknown): unknown {
  if (error instanceof ApiRequestError) {
    return new SendApiRequestError(error.response.status, error.responseBody);
  }

  return error;
}







